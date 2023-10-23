// SPDX-License-Identifier: LGPL-3.0-only
// Created By: Art Blocks Inc.

pragma solidity 0.8.19;

import {ISharedMinterSimplePurchaseV0} from "../../interfaces/v0.8.x/ISharedMinterSimplePurchaseV0.sol";
import {ISharedMinterV0} from "../../interfaces/v0.8.x/ISharedMinterV0.sol";
import {ISharedMinterDAV0} from "../../interfaces/v0.8.x/ISharedMinterDAV0.sol";
import {ISharedMinterDAExpV0} from "../../interfaces/v0.8.x/ISharedMinterDAExpV0.sol";
import {ISharedMinterDAExpSettlementV0} from "../../interfaces/v0.8.x/ISharedMinterDAExpSettlementV0.sol";
import {IMinterFilterV1} from "../../interfaces/v0.8.x/IMinterFilterV1.sol";

import {SettlementExpLib} from "../../libs/v0.8.x/minter-libs/SettlementExpLib.sol";
import {SplitFundsLib} from "../../libs/v0.8.x/minter-libs/SplitFundsLib.sol";
import {MaxInvocationsLib} from "../../libs/v0.8.x/minter-libs/MaxInvocationsLib.sol";
import {DAExpLib} from "../../libs/v0.8.x/minter-libs/DAExpLib.sol";
import {AuthLib} from "../../libs/v0.8.x/AuthLib.sol";

import {SafeCast} from "@openzeppelin-4.7/contracts/utils/math/SafeCast.sol";
import {ReentrancyGuard} from "@openzeppelin-4.5/contracts/security/ReentrancyGuard.sol";

/**
 * @title Shared, filtered Minter contract that allows tokens to be minted with
 * ETH.
 * Pricing is achieved using an automated Dutch-auction mechanism, with a
 * settlement mechanism for tokens purchased before the auction ends.
 * This is designed to be used with GenArt721CoreContractV3 flagship or
 * engine contracts.
 * @author Art Blocks Inc.
 * @notice Privileged Roles and Ownership:
 * This contract is designed to be managed, with limited powers.
 * Privileged roles and abilities are controlled by the core contract's Admin
 * ACL contract and a project's artist. Both of these roles hold extensive
 * power and can modify minter details.
 * Care must be taken to ensure that the admin ACL contract and artist
 * addresses are secure behind a multi-sig or other access control mechanism.
 * Additionally, the purchaser of a token has some trust assumptions regarding
 * settlement, beyond typical minter Art Blocks trust assumptions. In general,
 * Artists and Admin are trusted to not abuse their powers in a way that
 * would artifically inflate the sellout price of a project. They are
 * incentivized to not do so, as it would diminish their reputation and
 * ability to sell future projects. Agreements between Admin and Artist
 * may or may not be in place to further dissuade artificial inflation of an
 * auction's sellout price.
 * ----------------------------------------------------------------------------
 * The following functions are restricted to the minter filter's Admin ACL
 * contract:
 * - setMinimumPriceDecayHalfLifeSeconds
 * ----------------------------------------------------------------------------
 * The following functions are restricted to the core contract's Admin ACL
 * contract:
 * - resetAuctionDetails (note: this will prevent minting until a new auction
 *   is created)
 * ----------------------------------------------------------------------------
 * The following functions are restricted to a project's artist or the core
 * contract's Admin ACL contract:
 * - withdrawArtistAndAdminRevenues (note: this may only be called after an
 *   auction has sold out or has reached base price)
 * ----------------------------------------------------------------------------
 * The following functions are restricted to a project's artist:
 * - setAuctionDetails (note: this may only be called when there is no active
 *   auction, and must start at a price less than or equal to any previously
 *   made purchases)
 * - manuallyLimitProjectMaxInvocations
 * - syncProjectMaxInvocationsToCore (not implemented)
 * ----------------------------------------------------------------------------
 * Additional admin and artist privileged roles may be described on other
 * contracts that this minter integrates with.
 * ----------------------------------------------------------------------------
 * @notice Caution: While Engine projects must be registered on the Art Blocks
 * Core Registry to assign this minter, this minter does not enforce that a
 * project is registered when configured or queried. This is primarily for gas
 * optimization purposes. It is, therefore, possible that fake projects may be
 * configured on this minter, but they will not be able to mint tokens due to
 * checks performed by this minter's Minter Filter.
 *
 * @dev Note that while this minter makes use of `block.timestamp` and it is
 * technically possible that this value is manipulated by block producers via
 * denial of service (in PoS), such manipulation will not have material impact
 * on the price values of this minter given the business practices for how
 * pricing is congfigured for this minter and that variations on the order of
 * less than a minute should not meaningfully impact price given the minimum
 * allowable price decay rate that this minter intends to support.
 */
contract MinterDAExpSettlementV3 is
    ReentrancyGuard,
    ISharedMinterSimplePurchaseV0,
    ISharedMinterV0,
    ISharedMinterDAV0,
    ISharedMinterDAExpV0,
    ISharedMinterDAExpSettlementV0
{
    using SafeCast for uint256;

    /// Minter filter address this minter interacts with
    address public immutable minterFilterAddress;

    /// Minter filter this minter may interact with.
    IMinterFilterV1 private immutable minterFilter;

    /// minterType for this minter
    string public constant minterType = "MinterDAExpSettlementV3";

    /// minter version for this minter
    string public constant minterVersion = "v3.0.0";

    /// Minimum price decay half life: price can decay with a half life of a
    /// minimum of this amount (can cut in half a minimum of every N seconds).
    uint256 public minimumPriceDecayHalfLifeSeconds = 45; // 45 seconds

    /**
     * @notice Initializes contract to be a Filtered Minter for
     * `_minterFilter` minter filter.
     * @param _minterFilter Minter filter for which this will be a
     * filtered minter.
     */
    constructor(address _minterFilter) ReentrancyGuard() {
        minterFilterAddress = _minterFilter;
        minterFilter = IMinterFilterV1(_minterFilter);
        emit DAExpLib.AuctionMinHalfLifeSecondsUpdated(
            minimumPriceDecayHalfLifeSeconds
        );
    }

    /**
     * @notice Manually sets the local maximum invocations of project `_projectId`
     * with the provided `_maxInvocations`, checking that `_maxInvocations` is less
     * than or equal to the value of project `_project_id`'s maximum invocations that is
     * set on the core contract.
     * @dev Note that a `_maxInvocations` of 0 can only be set if the current `invocations`
     * value is also 0 and this would also set `maxHasBeenInvoked` to true, correctly short-circuiting
     * this minter's purchase function, avoiding extra gas costs from the core contract's maxInvocations check.
     * @param _projectId Project ID to set the maximum invocations for.
     * @param _coreContract Core contract address for the given project.
     * @param _maxInvocations Maximum invocations to set for the project.
     */
    function manuallyLimitProjectMaxInvocations(
        uint256 _projectId,
        address _coreContract,
        uint24 _maxInvocations
    ) external {
        AuthLib.onlyArtist({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _sender: msg.sender
        });
        // @dev guard rail to prevent accidentally adjusting max invocations
        // after one or more purchases have been made
        require(
            SettlementExpLib.getNumPurchasesOnMinter({
                _projectId: _projectId,
                _coreContract: _coreContract
            }) == 0,
            "Only before purchases"
        );
        MaxInvocationsLib.manuallyLimitProjectMaxInvocations({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _maxInvocations: _maxInvocations
        });
    }

    /**
     * @notice Sets auction details for project `_projectId`.
     * @param _projectId Project ID to set auction details for.
     * @param _coreContract Core contract address for the given project.
     * @param _auctionTimestampStart Timestamp at which to start the auction.
     * @param _priceDecayHalfLifeSeconds The half life with which to decay the
     *  price (in seconds).
     * @param _startPrice Price at which to start the auction, in Wei.
     * @param _basePrice Resting price of the auction, in Wei.
     * @dev Note that it is intentionally supported here that the configured
     * price may be explicitly set to `0`.
     */
    function setAuctionDetails(
        uint256 _projectId,
        address _coreContract,
        uint40 _auctionTimestampStart,
        uint40 _priceDecayHalfLifeSeconds,
        uint256 _startPrice,
        uint256 _basePrice
    ) external {
        AuthLib.onlyArtist({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _sender: msg.sender
        });
        // CHECKS
        // require valid start price on a settlement minter
        require(
            SettlementExpLib.isValidStartPrice({
                _projectId: _projectId,
                _coreContract: _coreContract,
                _startPrice: _startPrice
            }),
            "Only monotonic decreasing price"
        );
        // do not allow a base price of zero (to simplify logic on this minter)
        require(_basePrice > 0, "Base price must be non-zero");
        // require valid half life for this minter
        require(
            (_priceDecayHalfLifeSeconds >= minimumPriceDecayHalfLifeSeconds),
            "Price decay half life must be greater than min allowable value"
        );

        // EFFECTS
        DAExpLib.setAuctionDetailsExp({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _auctionTimestampStart: _auctionTimestampStart,
            _priceDecayHalfLifeSeconds: _priceDecayHalfLifeSeconds,
            _startPrice: _startPrice.toUint88(),
            _basePrice: _basePrice.toUint88(),
            // we set this to false so it prevents artist from altering auction
            // even after max has been invoked (require explicit auction reset
            // on settlement minter)
            _allowReconfigureAfterStart: false
        });

        // refresh max invocations, ensuring the values are populated, and
        // updating any local values that are illogical with respect to the
        // current core contract state.
        // @dev this refresh enables the guarantee that a project's max
        // invocation state is always populated if an auction is configured.
        // @dev this minter pays the higher gas cost of a full refresh here due
        // to the more severe ux degredation of a stale minter-local max
        // invocations state.
        MaxInvocationsLib.refreshMaxInvocations(_projectId, _coreContract);
    }

    /**
     * @notice Sets the minimum and maximum values that are settable for
     * `_priceDecayHalfLifeSeconds` across all projects.
     * @param _minimumPriceDecayHalfLifeSeconds Minimum price decay half life
     * (in seconds).
     */
    function setMinimumPriceDecayHalfLifeSeconds(
        uint256 _minimumPriceDecayHalfLifeSeconds
    ) external {
        AuthLib.onlyMinterFilterAdminACL({
            _minterFilterAddress: minterFilterAddress,
            _sender: msg.sender,
            _contract: address(this),
            _selector: this.setMinimumPriceDecayHalfLifeSeconds.selector
        });
        require(
            _minimumPriceDecayHalfLifeSeconds > 0,
            "Half life of zero not allowed"
        );
        minimumPriceDecayHalfLifeSeconds = _minimumPriceDecayHalfLifeSeconds;

        emit DAExpLib.AuctionMinHalfLifeSecondsUpdated(
            _minimumPriceDecayHalfLifeSeconds
        );
    }

    /**
     * @notice Resets auction details for project `_projectId`, zero-ing out all
     * relevant auction fields. Not intended to be used in normal auction
     * operation, but rather only in case of the need to halt an auction.
     * @param _projectId Project ID to set auction details for.
     */
    function resetAuctionDetails(
        uint256 _projectId,
        address _coreContract
    ) external {
        AuthLib.onlyCoreAdminACL({
            _coreContract: _coreContract,
            _sender: msg.sender,
            _contract: address(this),
            _selector: this.resetAuctionDetails.selector
        });

        SettlementExpLib.SettlementAuctionProjectConfig
            storage _settlementAuctionProjectConfig = SettlementExpLib
                .getSettlementAuctionProjectConfig(_projectId, _coreContract);

        // no reset after revenues collected, since that solidifies amount due
        require(
            !_settlementAuctionProjectConfig.auctionRevenuesCollected,
            "Only before revenues collected"
        );

        // EFFECTS
        // delete auction parameters
        DAExpLib.resetAuctionDetails({
            _projectId: _projectId,
            _coreContract: _coreContract
        });

        // @dev do NOT delete settlement parameters, as they are used to
        // determine settlement amounts even through a reset
    }

    /**
     * @notice This withdraws project revenues for the artist and admin.
     * This function is only callable by the artist or admin, and only after
     * one of the following is true:
     * - the auction has sold out above base price
     * - the auction has reached base price
     * Note that revenues are not claimable if in a temporary state after
     * an auction is reset.
     * Revenues may only be collected a single time per project.
     * After revenues are collected, auction parameters will never be allowed
     * to be reset, and excess settlement funds will become immutable and fully
     * deterministic.
     */
    function withdrawArtistAndAdminRevenues(
        uint256 _projectId,
        address _coreContract
    ) external nonReentrant {
        AuthLib.onlyCoreAdminACLOrArtist({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _sender: msg.sender,
            _contract: address(this),
            _selector: this.withdrawArtistAndAdminRevenues.selector
        });

        // @dev the following function affects settlement state and marks
        // revenues as collected, as well as distributes revenues.
        // CHECKS-EFFECTS-INTERACTIONS
        // @dev the following function updates the project's balance and will
        // revert if the project's balance is insufficient to cover the
        // settlement amount (which is expected to not be possible)
        SettlementExpLib.distributeArtistAndAdminRevenues({
            _projectId: _projectId,
            _coreContract: _coreContract
        });
    }

    /**
     * @notice Reclaims the sender's payment above current settled price for
     * project `_projectId` on core contract `_coreContract`.
     * The current settled price is the the price paid for the most recently
     * purchased token, or the base price if the artist has withdrawn revenues
     * after the auction reached base price.
     * This function is callable at any point, but is expected to typically be
     * called after auction has sold out above base price or after the auction
     * has been purchased at base price. This minimizes the amount of gas
     * required to send all excess settlement funds to the sender.
     * Sends excess settlement funds to msg.sender.
     * @param _projectId Project ID to reclaim excess settlement funds on.
     * @param _coreContract Contract address of the core contract
     */
    function reclaimProjectExcessSettlementFunds(
        uint256 _projectId,
        address _coreContract
    ) external {
        reclaimProjectExcessSettlementFundsTo(
            payable(msg.sender),
            _projectId,
            _coreContract
        );
    }

    /**
     * @notice Reclaims the sender's payment above current settled price for
     * projects in `_projectIds`. The current settled price is the the price
     * paid for the most recently purchased token, or the base price if the
     * artist has withdrawn revenues after the auction reached base price.
     * This function is callable at any point, but is expected to typically be
     * called after auction has sold out above base price or after the auction
     * has been purchased at base price. This minimizes the amount of gas
     * required to send all excess settlement funds to the sender.
     * Sends total of all excess settlement funds to msg.sender in a single
     * chunk. Entire transaction reverts if any excess settlement calculation
     * fails.
     * @param _projectIds Array of project IDs to reclaim excess settlement
     * funds on.
     * @param _coreContracts Array of core contract addresses for the given
     * projects. Must be in the same order as `_projectIds` (aligned by index).
     */
    function reclaimProjectsExcessSettlementFunds(
        uint256[] calldata _projectIds,
        address[] calldata _coreContracts
    ) external {
        // @dev input validation checks are performed in subcall
        reclaimProjectsExcessSettlementFundsTo(
            payable(msg.sender),
            _projectIds,
            _coreContracts
        );
    }

    /**
     * @notice Purchases a token from project `_projectId`.
     * @param _projectId Project ID to mint a token on.
     * @param _coreContract Core contract address for the given project.
     * @return tokenId Token ID of minted token
     */
    function purchase(
        uint256 _projectId,
        address _coreContract
    ) external payable returns (uint256 tokenId) {
        tokenId = purchaseTo({
            _to: msg.sender,
            _projectId: _projectId,
            _coreContract: _coreContract
        });

        return tokenId;
    }

    // public getter functions
    /**
     * @notice Gets the maximum invocations project configuration.
     * @param _coreContract The address of the core contract.
     * @param _projectId The ID of the project whose data needs to be fetched.
     * @return MaxInvocationsLib.MaxInvocationsProjectConfig instance with the
     * configuration data.
     */
    function maxInvocationsProjectConfig(
        uint256 _projectId,
        address _coreContract
    )
        external
        view
        returns (MaxInvocationsLib.MaxInvocationsProjectConfig memory)
    {
        return
            MaxInvocationsLib.getMaxInvocationsProjectConfig(
                _projectId,
                _coreContract
            );
    }

    /**
     * @notice Retrieves the auction parameters for a specific project.
     * @param _projectId The unique identifier for the project.
     * @param _coreContract The address of the core contract for the project.
     * @return timestampStart The start timestamp for the auction.
     * @return priceDecayHalfLifeSeconds The half-life for the price decay
     * during the auction, in seconds.
     * @return startPrice The starting price of the auction.
     * @return basePrice The base price of the auction.
     */
    function projectAuctionParameters(
        uint256 _projectId,
        address _coreContract
    )
        external
        view
        returns (
            uint40 timestampStart,
            uint40 priceDecayHalfLifeSeconds,
            uint256 startPrice,
            uint256 basePrice
        )
    {
        DAExpLib.DAProjectConfig storage _auctionProjectConfig = DAExpLib
            .getDAProjectConfig({
                _projectId: _projectId,
                _coreContract: _coreContract
            });
        timestampStart = _auctionProjectConfig.timestampStart;
        priceDecayHalfLifeSeconds = _auctionProjectConfig
            .priceDecayHalfLifeSeconds;
        startPrice = _auctionProjectConfig.startPrice;
        basePrice = _auctionProjectConfig.basePrice;
    }

    /**
     * @notice Checks if the specified `_coreContract` is a valid engine contract.
     * @dev This function retrieves the cached value of `_coreContract` from
     * the `isEngineCache` mapping. If the cached value is already set, it
     * returns the cached value. Otherwise, it calls the `getV3CoreIsEngine`
     * function from the `SplitFundsLib` library to check if `_coreContract`
     * is a valid engine contract.
     * @dev This function will revert if the provided `_coreContract` is not
     * a valid Engine or V3 Flagship contract.
     * @param _coreContract The address of the contract to check.
     * @return bool indicating if `_coreContract` is a valid engine contract.
     */
    function isEngineView(address _coreContract) external view returns (bool) {
        SplitFundsLib.IsEngineCache storage isEngineCache = SplitFundsLib
            .getIsEngineCacheConfig(_coreContract);
        if (isEngineCache.isCached) {
            return isEngineCache.isEngine;
        } else {
            // @dev this calls the non-modifying variant of getV3CoreIsEngine
            return SplitFundsLib.getV3CoreIsEngineView(_coreContract);
        }
    }

    /**
     * @notice projectId => has project reached its maximum number of
     * invocations? Note that this returns a local cache of the core contract's
     * state, and may be out of sync with the core contract. This is
     * intentional, as it only enables gas optimization of mints after a
     * project's maximum invocations has been reached. A false negative will
     * only result in a gas cost increase, since the core contract will still
     * enforce a maxInvocation check during minting. A false positive is not
     * possible because the V3 core contract only allows maximum invocations
     * to be reduced, not increased. Based on this rationale, we intentionally
     * do not do input validation in this method as to whether or not the input
     * @param `_projectId` is an existing project ID.
     * @param `_coreContract` is an existing core contract address.
     */
    function projectMaxHasBeenInvoked(
        uint256 _projectId,
        address _coreContract
    ) external view returns (bool) {
        return
            MaxInvocationsLib.getMaxHasBeenInvoked(_projectId, _coreContract);
    }

    /**
     * @notice projectId => project's maximum number of invocations.
     * Optionally synced with core contract value, for gas optimization.
     * Note that this returns a local cache of the core contract's
     * state, and may be out of sync with the core contract. This is
     * intentional, as it only enables gas optimization of mints after a
     * project's maximum invocations has been reached.
     * @dev A number greater than the core contract's project max invocations
     * will only result in a gas cost increase, since the core contract will
     * still enforce a maxInvocation check during minting. A number less than
     * the core contract's project max invocations is only possible when the
     * project's max invocations have not been synced on this minter, since the
     * V3 core contract only allows maximum invocations to be reduced, not
     * increased. When this happens, the minter will enable minting, allowing
     * the core contract to enforce the max invocations check. Based on this
     * rationale, we intentionally do not do input validation in this method as
     * to whether or not the input `_projectId` is an existing project ID.
     * @param `_projectId` is an existing project ID.
     * @param `_coreContract` is an existing core contract address.
     */
    function projectMaxInvocations(
        uint256 _projectId,
        address _coreContract
    ) external view returns (uint256) {
        return MaxInvocationsLib.getMaxInvocations(_projectId, _coreContract);
    }

    /**
     * @notice Gets the latest purchase price for project `_projectId`, or 0 if
     * no purchases have been made.
     * @param _projectId Project ID to get latest purchase price for.
     * @param _coreContract Contract address of the core contract
     */
    function getProjectLatestPurchasePrice(
        uint256 _projectId,
        address _coreContract
    ) external view returns (uint256 latestPurchasePrice) {
        SettlementExpLib.SettlementAuctionProjectConfig
            storage settlementAuctionProjectConfig = SettlementExpLib
                .getSettlementAuctionProjectConfig(_projectId, _coreContract);
        return settlementAuctionProjectConfig.latestPurchasePrice;
    }

    /**
     * @notice Gets the number of settleable invocations for project `_projectId`.
     * @param _projectId Project ID to get number of settleable invocations for.
     * @param _coreContract Contract address of the core contract
     */
    function getNumSettleableInvocations(
        uint256 _projectId,
        address _coreContract
    ) external view returns (uint256 numSettleableInvocations) {
        SettlementExpLib.SettlementAuctionProjectConfig
            storage settlementAuctionProjectConfig = SettlementExpLib
                .getSettlementAuctionProjectConfig(_projectId, _coreContract);
        return settlementAuctionProjectConfig.numSettleableInvocations;
    }

    /**
     * @notice Gets the balance of ETH, in wei, currently held by the minter
     * for project `_projectId`. This value is non-zero if not all purchasers
     * have reclaimed their excess settlement funds, or if an artist/admin has
     * not yet withdrawn their revenues.
     * @param _projectId Project ID to get balance for.
     * @param _coreContract Contract address of the core contract
     */
    function getProjectBalance(
        uint256 _projectId,
        address _coreContract
    ) external view returns (uint256 projectBalance) {
        SettlementExpLib.SettlementAuctionProjectConfig
            storage settlementAuctionProjectConfig = SettlementExpLib
                .getSettlementAuctionProjectConfig(_projectId, _coreContract);
        return settlementAuctionProjectConfig.projectBalance;
    }

    /**
     * @notice Gets if price of token is configured, price of minting a
     * token on project `_projectId`, and currency symbol and address to be
     * used as payment. Supersedes any core contract price information.
     * @param _projectId Project ID to get price information for
     * @param _coreContract Contract address of the core contract
     * @return isConfigured true only if token price has been configured on
     * this minter
     * @return tokenPriceInWei current price of token on this minter - invalid
     * if price has not yet been configured
     * @return currencySymbol currency symbol for purchases of project on this
     * minter. This minter always returns "ETH"
     * @return currencyAddress currency address for purchases of project on
     * this minter. This minter always returns null address, reserved for ether
     */
    function getPriceInfo(
        uint256 _projectId,
        address _coreContract
    )
        external
        view
        returns (
            bool isConfigured,
            uint256 tokenPriceInWei,
            string memory currencySymbol,
            address currencyAddress
        )
    {
        DAExpLib.DAProjectConfig storage auctionProjectConfig = DAExpLib
            .getDAProjectConfig({
                _projectId: _projectId,
                _coreContract: _coreContract
            });

        // take action based on configured state
        isConfigured = (auctionProjectConfig.startPrice > 0);
        if (!isConfigured) {
            // In the case of unconfigured auction, return price of zero when
            // getPriceSafe would otherwise revert
            tokenPriceInWei = 0;
        } else if (block.timestamp <= auctionProjectConfig.timestampStart) {
            // Provide a reasonable value for `tokenPriceInWei` when
            // getPriceSafe would otherwise revert, using the starting price
            // before auction starts.
            tokenPriceInWei = auctionProjectConfig.startPrice;
        } else {
            // call getPriceSafe to get the current price
            // @dev we do not use getPriceUnsafe here, as this is a view
            // function, and we prefer to use the extra gas to appropriately
            // correct for the case of a stale minter max invocation state.
            tokenPriceInWei = SettlementExpLib.getPriceSafe({
                _projectId: _projectId,
                _coreContract: _coreContract
            });
        }
        currencySymbol = "ETH";
        currencyAddress = address(0);
    }

    /**
     * @notice Gets the current excess settlement funds on project `_projectId`
     * for address `_walletAddress`. The returned value is expected to change
     * throughtout an auction, since the latest purchase price is used when
     * determining excess settlement funds.
     * A user may claim excess settlement funds by calling the function
     * `reclaimProjectExcessSettlementFunds(_projectId)`.
     * @param _projectId Project ID to query.
     * @param _walletAddress Account address for which the excess posted funds
     * is being queried.
     * @return excessSettlementFundsInWei Amount of excess settlement funds, in
     * wei
     */
    function getProjectExcessSettlementFunds(
        uint256 _projectId,
        address _coreContract,
        address _walletAddress
    ) external view returns (uint256 excessSettlementFundsInWei) {
        // input validation
        require(_walletAddress != address(0), "No zero address");

        (excessSettlementFundsInWei, ) = SettlementExpLib
            .getProjectExcessSettlementFunds({
                _projectId: _projectId,
                _coreContract: _coreContract,
                _walletAddress: _walletAddress
            });
        return excessSettlementFundsInWei;
    }

    /**
     * @notice Reclaims the sender's payment above current settled price for
     * project `_projectId` on core contract `_coreContract`.
     * The current settled price is the the price paid for the most recently
     * purchased token, or the base price if the artist has withdrawn revenues
     * after the auction reached base price.
     * This function is callable at any point, but is expected to typically be
     * called after auction has sold out above base price or after the auction
     * has been purchased at base price. This minimizes the amount of gas
     * required to send all excess settlement funds to the sender.
     * Sends excess settlement funds to address `_to`.
     * @param _to Address to send excess settlement funds to.
     * @param _projectId Project ID to reclaim excess settlement funds on.
     * @param _coreContract Contract address of the core contract
     */
    function reclaimProjectExcessSettlementFundsTo(
        address payable _to,
        uint256 _projectId,
        address _coreContract
    ) public nonReentrant {
        require(_to != address(0), "No claiming to the zero address");

        SettlementExpLib.reclaimProjectExcessSettlementFundsTo({
            _to: _to,
            _projectId: _projectId,
            _coreContract: _coreContract,
            _purchaserAddress: msg.sender
        });
    }

    /**
     * @notice Reclaims the sender's payment above current settled price for
     * projects in `_projectIds`. The current settled price is the the price
     * paid for the most recently purchased token, or the base price if the
     * artist has withdrawn revenues after the auction reached base price.
     * This function is callable at any point, but is expected to typically be
     * called after auction has sold out above base price or after the auction
     * has been purchased at base price. This minimizes the amount of gas
     * required to send all excess settlement funds to the sender.
     * Sends total of all excess settlement funds to `_to` in a single
     * chunk. Entire transaction reverts if any excess settlement calculation
     * fails.
     * @param _to Address to send excess settlement funds to.
     * @param _projectIds Array of project IDs to reclaim excess settlement
     * funds on.
     * @param _coreContracts Array of core contract addresses for the given
     * projects. Must be in the same order as `_projectIds` (aligned by index).
     */
    function reclaimProjectsExcessSettlementFundsTo(
        address payable _to,
        uint256[] calldata _projectIds,
        address[] calldata _coreContracts
    ) public nonReentrant {
        // CHECKS
        // input validation
        require(_to != address(0), "No claiming to the zero address");
        uint256 projectIdsLength = _projectIds.length;
        require(
            projectIdsLength == _coreContracts.length,
            "Array lengths must match"
        );
        // EFFECTS
        // for each project, tally up the excess settlement funds and update
        // the receipt in storage
        uint256 excessSettlementFunds;
        for (uint256 i; i < projectIdsLength; ) {
            SettlementExpLib.reclaimProjectExcessSettlementFundsTo({
                _to: _to,
                _projectId: _projectIds[i],
                _coreContract: _coreContracts[i],
                _purchaserAddress: msg.sender
            });

            // gas efficiently increment i
            // won't overflow due to for loop, as well as gas limts
            unchecked {
                ++i;
            }
        }

        // INTERACTIONS
        // send excess settlement funds in a single chunk for all
        // projects
        bool success_;
        (success_, ) = _to.call{value: excessSettlementFunds}("");
        require(success_, "Reclaiming failed");
    }

    /**
     * @notice Purchases a token from project `_projectId` and sets
     * the token's owner to `_to`.
     * @param _to Address to be the new token's owner.
     * @param _projectId Project ID to mint a token on.
     * @param _coreContract Core contract address for the given project.
     * @return tokenId Token ID of minted token
     */
    function purchaseTo(
        address _to,
        uint256 _projectId,
        address _coreContract
    ) public payable nonReentrant returns (uint256 tokenId) {
        // CHECKS
        // pre-mint MaxInvocationsLib checks
        // Note that `maxHasBeenInvoked` is only checked here to reduce gas
        // consumption after a project has been fully minted.
        // `_maxInvocationsProjectConfig.maxHasBeenInvoked` is locally cached to reduce
        // gas consumption, but if not in sync with the core contract's value,
        // the core contract also enforces its own max invocation check during
        // minting.
        MaxInvocationsLib.preMintChecks(_projectId, _coreContract);

        // _getPriceUnsafe reverts if auction has not yet started or auction is
        // unconfigured, and auction has not sold out or revenues have not been
        // withdrawn.
        // @dev _getPriceUnsafe is guaranteed to be accurate unless the core
        // contract is limiting invocations and we have stale local state
        // returning a false negative that max invocations have been reached.
        // This is acceptable, because that case will revert this
        // call later on in this function, when the core contract's max
        // invocation check fails.
        uint256 currentPriceInWei = SettlementExpLib.getPriceUnsafe({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _maxHasBeenInvoked: false // always false due to MaxInvocationsLib.preMintChecks
        });

        // EFFECTS
        // update and validate receipts, latest purchase price, overall project
        // balance, and number of tokens auctioned on this minter
        SettlementExpLib.preMintEffects({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _currentPriceInWei: currentPriceInWei,
            _msgValue: msg.value,
            _purchaserAddress: msg.sender
        });

        // INTERACTIONS
        tokenId = minterFilter.mint_joo({
            _to: _to,
            _projectId: _projectId,
            _coreContract: _coreContract,
            _sender: msg.sender
        });

        // verify token invocation is valid given local minter max invocations,
        // update local maxHasBeenInvoked
        MaxInvocationsLib.validatePurchaseEffectsInvocations(
            tokenId,
            _coreContract
        );

        // distribute payments if revenues have been collected, or increment
        // number of settleable invocations if revenues have not been collected
        SettlementExpLib.postMintInteractions({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _currentPriceInWei: currentPriceInWei
        });

        return tokenId;
    }

    /**
     * @notice This function is intentionally not implemented for this version
     * of the minter. Due to potential for unintended consequences, the
     * function `manuallyLimitProjectMaxInvocations` should be used to manually
     * and explicitly limit the maximum invocations for a project to a value
     * other than the core contract's maximum invocations for a project.
     * @param _coreContract Core contract address for the given project.
     * @param _projectId Project ID to set the maximum invocations for.
     */
    function syncProjectMaxInvocationsToCore(
        uint256 _projectId,
        address _coreContract
    ) public view {
        AuthLib.onlyArtist({
            _projectId: _projectId,
            _coreContract: _coreContract,
            _sender: msg.sender
        });
        revert("Not implemented");
    }
}
