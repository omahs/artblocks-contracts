// This file is used to configure the deployment of the Engine Partner contracts
// It is intended to be imported by the generic deployer by running `deploy:mainnet:v3-engine`, `deploy:staging:v3-engine` or `deploy:dev:v3-engine`.
export const deployConfigDetailsArray = [
  {
    network: "sepolia",
    // environment is only used for metadata purposes, and is not used in the deployment process
    // Please set to "dev", "staging", or "mainnet", as appropriate
    environment: "dev",
    // if you want to use an existing admin ACL, set the address here (otherwise set as undefined to deploy a new one)
    existingAdminACL: undefined,
    // the following must always be defined and accurate, even if using an existing admin ACL
    adminACLContractName: "AdminACLV0",
    genArt721CoreContractName: "GenArt721CoreV3",
    tokenName: "Art Blocks Core V3 Dev (Sepolia)",
    tokenTicker: "BLOCKS_CORE_V3_DEV_SEPOLIA",
    startingProjectId: 0,
    // set to true if you want to add an initial project to the core contract
    addInitialProject: true,
    // set to true if you want to transfer the superAdmin role to a different address
    doTransferSuperAdmin: false,
    // set to the address you want to transfer the superAdmin role to
    // (this will only work if you have set doTransferSuperAdmin to true, can be undefined if you are not transferring)
    newSuperAdminAddress: undefined, // use either "0x..." or undefined if not transferring
    // optional overrides for the default split percentages (default is 10% primary, 2.5% secondary)

    // optionally define this to set default vertical name for the contract after deployment.
    // if not defined, the default vertical name will be "unassigned".
    // common values include `fullyonchain`, `flex`, or partnerships like `artblocksxpace`.
    // also note that if you desire to create a new veritcal, you will need to add the vertical name to the
    // `project_verticals` table in the database before running this deploy script.
    defaultVerticalName: "presents",
  },
];
