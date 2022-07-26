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

import {
  getAccounts,
  assignDefaultConstants,
  deployAndGet,
  deployCoreWithMinterFilter,
} from "../../util/common";

/**
 * Tests for V3 core dealing with configuring projects.
 */
describe("GenArt721CoreV3", async function () {
  beforeEach(async function () {
    // standard accounts and constants
    this.accounts = await getAccounts();
    await assignDefaultConstants.call(this);

    const randomizerFactory = await ethers.getContractFactory(
      "BasicRandomizer"
    );
    this.randomizer = await randomizerFactory.deploy();
    const artblocksFactory = await ethers.getContractFactory("GenArt721CoreV3");
    this.genArt721Core = await artblocksFactory
      .connect(this.accounts.deployer)
      .deploy(this.name, this.symbol, this.randomizer.address);

    // TBD - V3 DOES NOT CURRENTLY HAVE A WORKING MINTER

    // allow artist to mint on contract
    await this.genArt721Core
      .connect(this.accounts.deployer)
      .updateMinterContract(this.accounts.artist.address);

    // add project zero
    await this.genArt721Core
      .connect(this.accounts.deployer)
      .addProject("name", this.accounts.artist.address);
    await this.genArt721Core
      .connect(this.accounts.deployer)
      .toggleProjectIsActive(this.projectZero);
    await this.genArt721Core
      .connect(this.accounts.artist)
      .updateProjectMaxInvocations(this.projectZero, this.maxInvocations);

    // add project one without setting it to active or setting max invocations
    await this.genArt721Core
      .connect(this.accounts.deployer)
      .addProject("name", this.accounts.artist2.address);
  });

  describe("updateProjectMaxInvocations", function () {
    it("only allows artist to update", async function () {
      // deployer cannot update
      await expectRevert(
        this.genArt721Core
          .connect(this.accounts.deployer)
          .updateProjectMaxInvocations(
            this.projectZero,
            this.maxInvocations - 1
          ),
        "Only artist"
      );
      // artist can update
      await this.genArt721Core
        .connect(this.accounts.artist)
        .updateProjectMaxInvocations(this.projectZero, this.maxInvocations - 1);
    });

    it("only allows maxInvocations to be reduced", async function () {
      // invocations must be reduced
      await expectRevert(
        this.genArt721Core
          .connect(this.accounts.artist)
          .updateProjectMaxInvocations(this.projectZero, this.maxInvocations),
        "maxInvocations may only be decreased"
      );
      // artist can reduce
      await this.genArt721Core
        .connect(this.accounts.artist)
        .updateProjectMaxInvocations(this.projectZero, this.maxInvocations - 1);
    });

    it("only allows maxInvocations to be gte current invocations", async function () {
      // mint a token on project zero
      await this.genArt721Core
        .connect(this.accounts.artist)
        .mint(
          this.accounts.artist.address,
          this.projectZero,
          this.accounts.artist.address
        );
      // invocations cannot be < current invocations
      await expectRevert(
        this.genArt721Core
          .connect(this.accounts.artist)
          .updateProjectMaxInvocations(this.projectZero, 0),
        "Only max invocations gte current invocations"
      );
      // artist can set to greater than current invocations
      await this.genArt721Core
        .connect(this.accounts.artist)
        .updateProjectMaxInvocations(this.projectZero, 2);
      // artist can set to equal to current invocations
      await this.genArt721Core
        .connect(this.accounts.artist)
        .updateProjectMaxInvocations(this.projectZero, 1);
    });
  });
});