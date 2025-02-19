import {
  BN,
  constants,
  expectEvent,
  expectRevert,
  balance,
  ether,
} from "@openzeppelin/test-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
const { MerkleTree } = require("merkletreejs");
import { hashAddress } from "../../minter-suite-minters/MinterMerkle/MinterMerkle.common";
const keccak256 = require("keccak256");

const numInitialMints = 500;
const numMintsToAverage = 15;

import {
  getAccounts,
  assignDefaultConstants,
  deployAndGet,
  deployCoreWithMinterFilter,
  safeAddProject,
} from "../../util/common";
import { ONE_MINUTE, ONE_HOUR, ONE_DAY } from "../../util/constants";

import { Logger } from "@ethersproject/logger";
// hide nuisance logs about event overloading
Logger.setLogLevel(Logger.levels.ERROR);

/**
 * General Gas tests for V3 core.
 * Used to test the gas cost of different operations on the core, specifically
 * when optimizing for gas to quantify % reductions to aide in decision making.
 */
describe("GenArt721CoreV3 Gas Tests", async function () {
  // increase test timeout from 20s to 40s due to minting numMintsToAverage tokens in beforeEach
  this.timeout(40000);

  beforeEach(async function () {
    // standard accounts and constants
    this.accounts = await getAccounts();
    await assignDefaultConstants.call(this);
    // use a higher max invocations to avoid artifically low gas costs
    this.higherMaxInvocationsForGasTests = 1000;
    // make price artifically low to enable more mints to simulate real-world common use cases
    this.pricePerTokenInWei = ethers.utils.parseEther("0.1");

    // deploy and configure minter filter and minter
    ({
      genArt721Core: this.genArt721Core,
      minterFilter: this.minterFilter,
      randomizer: this.randomizer,
    } = await deployCoreWithMinterFilter.call(
      this,
      "GenArt721CoreV3",
      "MinterFilterV1"
    ));

    this.minter = await deployAndGet.call(this, "MinterSetPriceV2", [
      this.genArt721Core.address,
      this.minterFilter.address,
    ]);

    this.minterSetPriceERC20 = await deployAndGet.call(
      this,
      "MinterSetPriceERC20V2",
      [this.genArt721Core.address, this.minterFilter.address]
    );

    this.minterDAExp = await deployAndGet.call(this, "MinterDAExpV2", [
      this.genArt721Core.address,
      this.minterFilter.address,
    ]);

    this.minterDAExpSettlement = await deployAndGet.call(
      this,
      "MinterDAExpSettlementV0",
      [this.genArt721Core.address, this.minterFilter.address]
    );

    this.minterDALin = await deployAndGet.call(this, "MinterDALinV2", [
      this.genArt721Core.address,
      this.minterFilter.address,
    ]);

    this.minterMerkle = await deployAndGet.call(this, "MinterMerkleV3", [
      this.genArt721Core.address,
      this.minterFilter.address,
      constants.ZERO_ADDRESS, // dummy delegation registry address since not used in these tests
    ]);

    this.minterHolder = await deployAndGet.call(this, "MinterHolderV2", [
      this.genArt721Core.address,
      this.minterFilter.address,
      constants.ZERO_ADDRESS, // dummy delegation registry address since not used in these tests
    ]);

    // add four projects, test on project three to directly compare to V1 core, which starts at projectId = 3
    for (let i = 0; i < 4; i++) {
      await safeAddProject(
        this.genArt721Core,
        this.accounts.deployer,
        this.accounts.artist.address
      );
    }

    // configure project three (to compare directly to V1 core)
    await this.genArt721Core
      .connect(this.accounts.deployer)
      .toggleProjectIsActive(this.projectThree);
    await this.genArt721Core
      .connect(this.accounts.artist)
      .toggleProjectIsPaused(this.projectThree);
    await this.genArt721Core
      .connect(this.accounts.artist)
      .updateProjectMaxInvocations(
        this.projectThree,
        this.higherMaxInvocationsForGasTests
      );
    // configure minter for project three
    await this.minterFilter
      .connect(this.accounts.deployer)
      .addApprovedMinter(this.minter.address);
    await this.minterFilter
      .connect(this.accounts.deployer)
      .addApprovedMinter(this.minterDAExp.address);
    await this.minterFilter
      .connect(this.accounts.deployer)
      .setMinterForProject(this.projectThree, this.minter.address);
    await this.minter
      .connect(this.accounts.artist)
      .updatePricePerTokenInWei(this.projectThree, this.pricePerTokenInWei);
    // mint numMintsToAverage tokens on project one to simulate a typical real-world use case
    for (let i = 0; i < numMintsToAverage; i++) {
      await this.minter
        .connect(this.accounts.user)
        .purchase(this.projectThree, { value: this.pricePerTokenInWei });
    }
  });

  describe("mint gas optimization", function () {
    it("test gas cost of mint on MinterSetPrice [ @skip-on-coverage ]", async function () {
      // report gas over an average of numMintsToAverage purchases
      const receipts = [];
      for (let index = 0; index < numMintsToAverage; index++) {
        const tx = await this.minter
          .connect(this.accounts.user)
          .purchase_H4M(this.projectThree, { value: this.pricePerTokenInWei });
        receipts.push(await ethers.provider.getTransactionReceipt(tx.hash));
      }
      const gasUseds = receipts.map((receipt) => receipt.gasUsed);
      const avgGasUsed = gasUseds
        .reduce((a, b) => a.add(b))
        .div(gasUseds.length);
      console.log(`average gas used for mint optimization test: ${avgGasUsed}`);
      const avgGasCostAt100gwei = receipts[0].effectiveGasPrice
        .mul(avgGasUsed)
        .toString();

      const avgGasCostAt100gweiInETH = parseFloat(
        ethers.utils.formatUnits(avgGasCostAt100gwei, "ether")
      );
      const avgGasCostAt100gweiAt2kUSDPerETH = avgGasCostAt100gweiInETH * 2e3;
      console.log(
        `=USD at 100gwei, $2k USD/ETH: \$${avgGasCostAt100gweiAt2kUSDPerETH}`
      );
    });

    it("test gas cost of mint on MinterSetPriceERC20 [ @skip-on-coverage ]", async function () {
      // set project three minter to minterSetPriceERC20, and configure
      await this.minterFilter
        .connect(this.accounts.deployer)
        .addApprovedMinter(this.minterSetPriceERC20.address);
      await this.minterFilter
        .connect(this.accounts.deployer)
        .setMinterForProject(
          this.projectThree,
          this.minterSetPriceERC20.address
        );
      await this.minterSetPriceERC20
        .connect(this.accounts.artist)
        .updatePricePerTokenInWei(this.projectThree, this.pricePerTokenInWei);

      // report gas over an average of numMintsToAverage purchases
      const receipts = [];
      for (let index = 0; index < numMintsToAverage; index++) {
        const tx = await this.minterSetPriceERC20
          .connect(this.accounts.user)
          .purchase_H4M(this.projectThree, { value: this.pricePerTokenInWei });
        receipts.push(await ethers.provider.getTransactionReceipt(tx.hash));
      }
      const gasUseds = receipts.map((receipt) => receipt.gasUsed);
      const avgGasUsed = gasUseds
        .reduce((a, b) => a.add(b))
        .div(gasUseds.length);
      console.log(`average gas used for mint optimization test: ${avgGasUsed}`);
      const avgGasCostAt100gwei = receipts[0].effectiveGasPrice
        .mul(avgGasUsed)
        .toString();

      const avgGasCostAt100gweiInETH = parseFloat(
        ethers.utils.formatUnits(avgGasCostAt100gwei, "ether")
      );
      const avgGasCostAt100gweiAt2kUSDPerETH = avgGasCostAt100gweiInETH * 2e3;
      console.log(
        `=USD at 100gwei, $2k USD/ETH: \$${avgGasCostAt100gweiAt2kUSDPerETH}`
      );
    });

    it("test gas cost of mint on MinterDAExp [ @skip-on-coverage ]", async function () {
      this.startingPrice = ethers.utils.parseEther("10");
      this.basePrice = ethers.utils.parseEther("0.05");
      this.defaultHalfLife = ONE_HOUR / 2;
      this.auctionStartTimeOffset = ONE_HOUR;
      if (!this.startTime) {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        this.startTime = block.timestamp;
      }
      this.startTime = this.startTime + ONE_DAY;

      await ethers.provider.send("evm_mine", [this.startTime - ONE_MINUTE]);
      // set project three minter to minterDAExp, and configure
      await this.minterFilter
        .connect(this.accounts.deployer)
        .addApprovedMinter(this.minterDAExp.address);
      await this.minterFilter
        .connect(this.accounts.deployer)
        .setMinterForProject(this.projectThree, this.minterDAExp.address);
      await this.minterDAExp
        .connect(this.accounts.artist)
        .setAuctionDetails(
          this.projectThree,
          this.startTime + this.auctionStartTimeOffset,
          this.defaultHalfLife,
          this.startingPrice,
          this.basePrice
        );
      await ethers.provider.send("evm_mine", [
        this.startTime + this.auctionStartTimeOffset,
      ]);

      // report gas over an average of numMintsToAverage purchases
      const receipts = [];
      for (let index = 0; index < numMintsToAverage; index++) {
        const tx = await this.minterDAExp
          .connect(this.accounts.user)
          .purchase_H4M(this.projectThree, { value: this.startingPrice });
        receipts.push(await ethers.provider.getTransactionReceipt(tx.hash));
      }
      const gasUseds = receipts.map((receipt) => receipt.gasUsed);
      const avgGasUsed = gasUseds
        .reduce((a, b) => a.add(b))
        .div(gasUseds.length);
      console.log(`average gas used for mint optimization test: ${avgGasUsed}`);
      const avgGasCostAt100gwei = receipts[0].effectiveGasPrice
        .mul(avgGasUsed)
        .toString();

      const avgGasCostAt100gweiInETH = parseFloat(
        ethers.utils.formatUnits(avgGasCostAt100gwei, "ether")
      );
      const avgGasCostAt100gweiAt2kUSDPerETH = avgGasCostAt100gweiInETH * 2e3;
      console.log(
        `=USD at 100gwei, $2k USD/ETH: \$${avgGasCostAt100gweiAt2kUSDPerETH}`
      );
    });

    it("test gas cost of mint on MinterDAExpSettlement [ @skip-on-coverage ]", async function () {
      this.startingPrice = ethers.utils.parseEther("10");
      this.basePrice = ethers.utils.parseEther("0.05");
      this.defaultHalfLife = ONE_HOUR / 2;
      this.auctionStartTimeOffset = ONE_HOUR;
      if (!this.startTime) {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        this.startTime = block.timestamp;
      }
      this.startTime = this.startTime + ONE_DAY;

      await ethers.provider.send("evm_mine", [this.startTime - ONE_MINUTE]);
      // set project three minter to minterDAExpSettlement, and configure
      await this.minterFilter
        .connect(this.accounts.deployer)
        .addApprovedMinter(this.minterDAExpSettlement.address);
      await this.minterFilter
        .connect(this.accounts.deployer)
        .setMinterForProject(
          this.projectThree,
          this.minterDAExpSettlement.address
        );
      await this.minterDAExpSettlement
        .connect(this.accounts.artist)
        .setAuctionDetails(
          this.projectThree,
          this.startTime + this.auctionStartTimeOffset,
          this.defaultHalfLife,
          this.startingPrice,
          this.basePrice
        );
      await ethers.provider.send("evm_mine", [
        this.startTime + this.auctionStartTimeOffset,
      ]);

      // report gas over an average of numMintsToAverage purchases
      const receipts = [];
      for (let index = 0; index < numMintsToAverage; index++) {
        const tx = await this.minterDAExpSettlement
          .connect(this.accounts.user)
          .purchase_H4M(this.projectThree, { value: this.startingPrice });
        receipts.push(await ethers.provider.getTransactionReceipt(tx.hash));
      }
      const gasUseds = receipts.map((receipt) => receipt.gasUsed);
      const avgGasUsed = gasUseds
        .reduce((a, b) => a.add(b))
        .div(gasUseds.length);
      console.log(`average gas used for mint optimization test: ${avgGasUsed}`);
      const avgGasCostAt100gwei = receipts[0].effectiveGasPrice
        .mul(avgGasUsed)
        .toString();

      const avgGasCostAt100gweiInETH = parseFloat(
        ethers.utils.formatUnits(avgGasCostAt100gwei, "ether")
      );
      const avgGasCostAt100gweiAt2kUSDPerETH = avgGasCostAt100gweiInETH * 2e3;
      console.log(
        `=USD at 100gwei, $2k USD/ETH: \$${avgGasCostAt100gweiAt2kUSDPerETH}`
      );
    });

    it("test gas cost of mint on MinterDALin [ @skip-on-coverage ]", async function () {
      this.basePrice = ethers.utils.parseEther("0.05");
      this.startingPrice = ethers.utils.parseEther("0.25");
      this.auctionStartTimeOffset = ONE_HOUR;
      if (!this.startTime) {
        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        this.startTime = block.timestamp;
      }
      this.startTime = this.startTime + ONE_DAY;

      await ethers.provider.send("evm_mine", [this.startTime - ONE_MINUTE]);
      // set project three minter to minterDALin, and configure
      await this.minterFilter
        .connect(this.accounts.deployer)
        .addApprovedMinter(this.minterDALin.address);
      await this.minterFilter
        .connect(this.accounts.deployer)
        .setMinterForProject(this.projectThree, this.minterDALin.address);

      await this.minterDALin
        .connect(this.accounts.artist)
        .setAuctionDetails(
          this.projectThree,
          this.startTime + this.auctionStartTimeOffset,
          this.startTime + this.auctionStartTimeOffset + ONE_HOUR * 2,
          this.startingPrice,
          this.basePrice
        );
      await ethers.provider.send("evm_mine", [
        this.startTime + this.auctionStartTimeOffset,
      ]);

      // report gas over an average of numMintsToAverage purchases
      const receipts = [];
      for (let index = 0; index < numMintsToAverage; index++) {
        const tx = await this.minterDALin
          .connect(this.accounts.user)
          .purchase_H4M(this.projectThree, { value: this.startingPrice });
        receipts.push(await ethers.provider.getTransactionReceipt(tx.hash));
      }
      const gasUseds = receipts.map((receipt) => receipt.gasUsed);
      const avgGasUsed = gasUseds
        .reduce((a, b) => a.add(b))
        .div(gasUseds.length);
      console.log(`average gas used for mint optimization test: ${avgGasUsed}`);
      const avgGasCostAt100gwei = receipts[0].effectiveGasPrice
        .mul(avgGasUsed)
        .toString();

      const avgGasCostAt100gweiInETH = parseFloat(
        ethers.utils.formatUnits(avgGasCostAt100gwei, "ether")
      );
      const avgGasCostAt100gweiAt2kUSDPerETH = avgGasCostAt100gweiInETH * 2e3;
      console.log(
        `=USD at 100gwei, $2k USD/ETH: \$${avgGasCostAt100gweiAt2kUSDPerETH}`
      );
    });

    it("test gas cost of mint on MinterMerkle [ @skip-on-coverage ]", async function () {
      // set project three minter to MinterMerkle, and configure
      await this.minterFilter
        .connect(this.accounts.deployer)
        .addApprovedMinter(this.minterMerkle.address);
      await this.minterFilter
        .connect(this.accounts.deployer)
        .setMinterForProject(this.projectThree, this.minterMerkle.address);
      // set price for project three on minter
      await this.minterMerkle
        .connect(this.accounts.artist)
        .updatePricePerTokenInWei(this.projectThree, this.pricePerTokenInWei);

      // build new Merkle tree from 1k addresses, including user's address
      const _allowlist = [this.accounts.user.address];
      const crypto = require("crypto");
      for (let i = 1; i < 1000; i++) {
        const _pk = crypto.randomBytes(32).toString("hex");
        const _addr = ethers.utils.computeAddress("0x" + _pk);
        _allowlist.push(_addr);
      }
      const _merkleTree = new MerkleTree(
        _allowlist.map((_addr) => hashAddress(_addr)),
        keccak256,
        {
          sortPairs: true,
        }
      );
      // update Merkle root
      await this.minterMerkle
        .connect(this.accounts.artist)
        .updateMerkleRoot(this.projectThree, _merkleTree.getRoot());
      // allow unlimited mints to enable taking an average
      await this.minterMerkle
        .connect(this.accounts.artist)
        .setProjectInvocationsPerAddress(this.projectThree, 0);
      await this.minterMerkle
        .connect(this.accounts.artist)
        .updateMerkleRoot(this.projectThree, _merkleTree.getRoot());
      // user mint with new Merkle proof
      const userMerkleProof = _merkleTree.getHexProof(
        hashAddress(this.accounts.user.address)
      );

      // report gas over an average of numMintsToAverage purchases
      const receipts = [];
      for (let index = 0; index < numMintsToAverage; index++) {
        const tx = await this.minterMerkle
          .connect(this.accounts.user)
          .purchase_gD5(this.projectThree, userMerkleProof, {
            value: this.pricePerTokenInWei,
          });
        receipts.push(await ethers.provider.getTransactionReceipt(tx.hash));
      }
      const gasUseds = receipts.map((receipt) => receipt.gasUsed);
      const avgGasUsed = gasUseds
        .reduce((a, b) => a.add(b))
        .div(gasUseds.length);
      console.log(`average gas used for mint optimization test: ${avgGasUsed}`);
      const avgGasCostAt100gwei = receipts[0].effectiveGasPrice
        .mul(avgGasUsed)
        .toString();

      const avgGasCostAt100gweiInETH = parseFloat(
        ethers.utils.formatUnits(avgGasCostAt100gwei, "ether")
      );
      const avgGasCostAt100gweiAt2kUSDPerETH = avgGasCostAt100gweiInETH * 2e3;
      console.log(
        `=USD at 100gwei, $2k USD/ETH: \$${avgGasCostAt100gweiAt2kUSDPerETH}`
      );
    });

    it("test gas cost of mint on MinterHolder [ @skip-on-coverage ]", async function () {
      // set project three minter to MinterHolder, and configure
      await this.minterFilter
        .connect(this.accounts.deployer)
        .addApprovedMinter(this.minterHolder.address);
      await this.minterFilter
        .connect(this.accounts.deployer)
        .setMinterForProject(this.projectThree, this.minterHolder.address);
      // set price for project three on minter
      await this.minterHolder
        .connect(this.accounts.artist)
        .updatePricePerTokenInWei(this.projectThree, this.pricePerTokenInWei);

      // configure minter
      await this.minterHolder
        .connect(this.accounts.deployer)
        .registerNFTAddress(this.genArt721Core.address);
      await this.minterHolder
        .connect(this.accounts.artist)
        .allowHoldersOfProjects(
          this.projectThree,
          [this.genArt721Core.address],
          [this.projectOne]
        );

      // configure project three (to compare directly to V1 core)
      await this.genArt721Core
        .connect(this.accounts.deployer)
        .toggleProjectIsActive(this.projectOne);
      await this.genArt721Core
        .connect(this.accounts.artist)
        .toggleProjectIsPaused(this.projectOne);
      await this.genArt721Core
        .connect(this.accounts.artist)
        .updateProjectMaxInvocations(this.projectOne, this.maxInvocations);
      await this.minterFilter
        .connect(this.accounts.deployer)
        .setMinterForProject(this.projectOne, this.minter.address);
      await this.minter
        .connect(this.accounts.artist)
        .updatePricePerTokenInWei(this.projectOne, this.pricePerTokenInWei);

      // user mints a couple tokens on projectOne to use as a pass
      for (let i = 0; i < 2; i++) {
        await this.minter
          .connect(this.accounts.user)
          .purchase(this.projectOne, { value: this.pricePerTokenInWei });
      }

      // report gas over an average of numMintsToAverage purchases
      const receipts = [];
      for (let index = 0; index < numMintsToAverage; index++) {
        // mint on MinterHolder
        const tx = await this.minterHolder
          .connect(this.accounts.user)
          .purchase_nnf(
            this.projectThree,
            this.genArt721Core.address,
            this.projectOneTokenOne.toNumber(),
            {
              value: this.pricePerTokenInWei,
            }
          );
        receipts.push(await ethers.provider.getTransactionReceipt(tx.hash));
      }
      const gasUseds = receipts.map((receipt) => receipt.gasUsed);
      const avgGasUsed = gasUseds
        .reduce((a, b) => a.add(b))
        .div(gasUseds.length);
      console.log(`average gas used for mint optimization test: ${avgGasUsed}`);
      const avgGasCostAt100gwei = receipts[0].effectiveGasPrice
        .mul(avgGasUsed)
        .toString();

      const avgGasCostAt100gweiInETH = parseFloat(
        ethers.utils.formatUnits(avgGasCostAt100gwei, "ether")
      );
      const avgGasCostAt100gweiAt2kUSDPerETH = avgGasCostAt100gweiInETH * 2e3;
      console.log(
        `=USD at 100gwei, $2k USD/ETH: \$${avgGasCostAt100gweiAt2kUSDPerETH}`
      );
    });
  });
});
