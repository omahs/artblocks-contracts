// SPDX-License-Identifier: LGPL-3.0-only
// Creatd By: Art Blocks Inc.

import "../libs/0.5.x/SafeMath.sol";
import "../libs/0.5.x/Strings.sol";
import "../libs/0.5.x/IERC20.sol";

import "../interfaces/0.5.x/IGenArt721CoreContractV1.sol";
import "../interfaces/0.5.x/IBonusContract.sol";

pragma solidity ^0.5.0;

contract GenArt721LegacyMinter {
    using SafeMath for uint256;

    IGenArt721CoreContractV1 public artblocksContract;

    uint256 constant ONE_MILLION = 1_000_000;

    mapping(uint256 => bool) public projectIdToBonus;
    mapping(uint256 => address) public projectIdToBonusContractAddress;
    mapping(uint256 => bool) public contractFilterProject;
    mapping(address => mapping(uint256 => uint256)) public projectMintCounter;
    mapping(uint256 => uint256) public projectMintLimit;
    mapping(uint256 => bool) public projectMaxHasBeenInvoked;
    mapping(uint256 => uint256) public projectMaxInvocations;

    constructor(address _genArt721Address) public {
        artblocksContract = IGenArt721CoreContractV1(_genArt721Address);
    }

    function getYourBalanceOfProjectERC20(
        uint256 _projectId
    ) public view returns (uint256) {
        uint256 balance = IERC20(
            artblocksContract.projectIdToCurrencyAddress(_projectId)
        ).balanceOf(msg.sender);
        return balance;
    }

    function checkYourAllowanceOfProjectERC20(
        uint256 _projectId
    ) public view returns (uint256) {
        uint256 remaining = IERC20(
            artblocksContract.projectIdToCurrencyAddress(_projectId)
        ).allowance(msg.sender, address(this));
        return remaining;
    }

    function setProjectMintLimit(uint256 _projectId, uint8 _limit) public {
        require(
            artblocksContract.isWhitelisted(msg.sender),
            "can only be set by admin"
        );
        projectMintLimit[_projectId] = _limit;
    }

    function setProjectMaxInvocations(uint256 _projectId) public {
        require(
            artblocksContract.isWhitelisted(msg.sender),
            "can only be set by admin"
        );
        uint256 maxInvocations;
        uint256 invocations;
        (, , invocations, maxInvocations, , , , , ) = artblocksContract
            .projectTokenInfo(_projectId);
        projectMaxInvocations[_projectId] = maxInvocations;
        if (invocations < maxInvocations) {
            projectMaxHasBeenInvoked[_projectId] = false;
        }
    }

    function toggleContractFilter(uint256 _projectId) public {
        require(
            artblocksContract.isWhitelisted(msg.sender),
            "can only be set by admin"
        );
        contractFilterProject[_projectId] = !contractFilterProject[_projectId];
    }

    function artistToggleBonus(uint256 _projectId) public {
        require(
            msg.sender ==
                artblocksContract.projectIdToArtistAddress(_projectId),
            "can only be set by artist"
        );
        projectIdToBonus[_projectId] = !projectIdToBonus[_projectId];
    }

    function artistSetBonusContractAddress(
        uint256 _projectId,
        address _bonusContractAddress
    ) public {
        require(
            msg.sender ==
                artblocksContract.projectIdToArtistAddress(_projectId),
            "can only be set by artist"
        );
        projectIdToBonusContractAddress[_projectId] = _bonusContractAddress;
    }

    function purchase(
        uint256 _projectId
    ) public payable returns (uint256 _tokenId) {
        return purchaseTo(msg.sender, _projectId);
    }

    //removed public and payable
    function purchaseTo(
        address _to,
        uint256 _projectId
    ) private returns (uint256 _tokenId) {
        require(
            !projectMaxHasBeenInvoked[_projectId],
            "Maximum number of invocations reached"
        );
        if (
            keccak256(
                abi.encodePacked(
                    artblocksContract.projectIdToCurrencySymbol(_projectId)
                )
            ) != keccak256(abi.encodePacked("ETH"))
        ) {
            require(
                msg.value == 0,
                "this project accepts a different currency and cannot accept ETH"
            );
            require(
                IERC20(artblocksContract.projectIdToCurrencyAddress(_projectId))
                    .allowance(msg.sender, address(this)) >=
                    artblocksContract.projectIdToPricePerTokenInWei(_projectId),
                "Insufficient Funds Approved for TX"
            );
            require(
                IERC20(artblocksContract.projectIdToCurrencyAddress(_projectId))
                    .balanceOf(msg.sender) >=
                    artblocksContract.projectIdToPricePerTokenInWei(_projectId),
                "Insufficient balance."
            );
            _splitFundsERC20(_projectId);
        } else {
            require(
                msg.value >=
                    artblocksContract.projectIdToPricePerTokenInWei(_projectId),
                "Must send minimum value to mint!"
            );
            _splitFundsETH(_projectId);
        }

        // if contract filter is active prevent calls from another contract
        if (contractFilterProject[_projectId])
            require(msg.sender == tx.origin, "No Contract Buys");

        // limit mints per address by project
        if (projectMintLimit[_projectId] > 0) {
            require(
                projectMintCounter[msg.sender][_projectId] <
                    projectMintLimit[_projectId],
                "Reached minting limit"
            );
            projectMintCounter[msg.sender][_projectId]++;
        }

        uint256 tokenId = artblocksContract.mint(_to, _projectId, msg.sender);
        // What if this overflows, since default value of uint256 is 0?
        // that is intended, so that by default the minter allows infinite transactions,
        // allowing the artblocks contract to stop minting
        // uint256 tokenInvocation = tokenId % ONE_MILLION;
        if (tokenId % ONE_MILLION == projectMaxInvocations[_projectId] - 1) {
            projectMaxHasBeenInvoked[_projectId] = true;
        }

        if (projectIdToBonus[_projectId]) {
            require(
                IBonusContract(projectIdToBonusContractAddress[_projectId])
                    .bonusIsActive(),
                "bonus must be active"
            );
            IBonusContract(projectIdToBonusContractAddress[_projectId])
                .triggerBonus(msg.sender);
        }

        return tokenId;
    }

    function _splitFundsETH(uint256 _projectId) internal {
        if (msg.value > 0) {
            uint256 pricePerTokenInWei = artblocksContract
                .projectIdToPricePerTokenInWei(_projectId);
            uint256 refund = msg.value.sub(
                artblocksContract.projectIdToPricePerTokenInWei(_projectId)
            );
            if (refund > 0) {
                msg.sender.transfer(refund);
            }
            uint256 foundationAmount = pricePerTokenInWei.div(100).mul(
                artblocksContract.artblocksPercentage()
            );
            if (foundationAmount > 0) {
                artblocksContract.artblocksAddress().transfer(foundationAmount);
            }
            uint256 projectFunds = pricePerTokenInWei.sub(foundationAmount);
            uint256 additionalPayeeAmount;
            if (
                artblocksContract.projectIdToAdditionalPayeePercentage(
                    _projectId
                ) > 0
            ) {
                additionalPayeeAmount = projectFunds.div(100).mul(
                    artblocksContract.projectIdToAdditionalPayeePercentage(
                        _projectId
                    )
                );
                if (additionalPayeeAmount > 0) {
                    artblocksContract
                        .projectIdToAdditionalPayee(_projectId)
                        .transfer(additionalPayeeAmount);
                }
            }
            uint256 creatorFunds = projectFunds.sub(additionalPayeeAmount);
            if (creatorFunds > 0) {
                artblocksContract.projectIdToArtistAddress(_projectId).transfer(
                    creatorFunds
                );
            }
        }
    }

    function _splitFundsERC20(uint256 _projectId) internal {
        uint256 pricePerTokenInWei = artblocksContract
            .projectIdToPricePerTokenInWei(_projectId);
        uint256 foundationAmount = pricePerTokenInWei.div(100).mul(
            artblocksContract.artblocksPercentage()
        );
        if (foundationAmount > 0) {
            IERC20(artblocksContract.projectIdToCurrencyAddress(_projectId))
                .transferFrom(
                    msg.sender,
                    artblocksContract.artblocksAddress(),
                    foundationAmount
                );
        }
        uint256 projectFunds = pricePerTokenInWei.sub(foundationAmount);
        uint256 additionalPayeeAmount;
        if (
            artblocksContract.projectIdToAdditionalPayeePercentage(_projectId) >
            0
        ) {
            additionalPayeeAmount = projectFunds.div(100).mul(
                artblocksContract.projectIdToAdditionalPayeePercentage(
                    _projectId
                )
            );
            if (additionalPayeeAmount > 0) {
                IERC20(artblocksContract.projectIdToCurrencyAddress(_projectId))
                    .transferFrom(
                        msg.sender,
                        artblocksContract.projectIdToAdditionalPayee(
                            _projectId
                        ),
                        additionalPayeeAmount
                    );
            }
        }
        uint256 creatorFunds = projectFunds.sub(additionalPayeeAmount);
        if (creatorFunds > 0) {
            IERC20(artblocksContract.projectIdToCurrencyAddress(_projectId))
                .transferFrom(
                    msg.sender,
                    artblocksContract.projectIdToArtistAddress(_projectId),
                    creatorFunds
                );
        }
    }
}
