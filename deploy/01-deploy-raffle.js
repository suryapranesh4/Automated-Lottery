const { network, ethers } = require("hardhat");
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat.config");
const { verify } = require("../utils/verify");
require("dotenv").config();

const FUND_AMOUNT = ethers.utils.parseEther("30"); // 1 Ether, or 1e18 (10^18) Wei

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

    if (chainId == 31337) {
        // create VRFV2 Subscription
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait();
        subscriptionId = transactionReceipt.events[0].args.subId;
        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS;

    const args = [
        vrfCoordinatorV2Address,
        networkConfig[chainId]["raffleEntranceFee"],
        networkConfig[chainId]["gasLane"],
        subscriptionId,
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["keepersUpdateInterval"],
    ];

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    });

    //Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(raffle.address, args);
    }

    const networkName = network.name == "hardhat" ? "localhost" : network.name;
};
module.exports.tags = ["all", "raffle"];
