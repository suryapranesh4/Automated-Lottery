const { ethers, network } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

const FRONTEND_ABI_ADDRESS = "../nextjs-lottery/constants/abi.json";
const FRONTEND_CONTRACT_ADDRESS = "../nextjs-lottery/constants/contractAddress.json";

module.exports = async function () {
    if (process.env.UPDATE_FRONTEND) {
        console.log(
            "Updating frontend, will update ABI & Contract Address JSON in nextJs lottery frontend applications"
        );
        await updateContractAddress();
        await updateAbi();
    }
};

async function updateAbi() {
    const raffle = await ethers.getContract("Raffle");
    fs.writeFileSync(FRONTEND_ABI_ADDRESS, raffle.interface.format(ethers.utils.FormatTypes.json));
}

async function updateContractAddress() {
    const raffle = await ethers.getContract("Raffle");
    console.log("Raffle address : ", raffle.address);

    const chainId = network.config.chainId.toString();
    console.log("ChainId :", chainId);

    const currentAddress = JSON.parse(fs.readFileSync(FRONTEND_CONTRACT_ADDRESS, "utf8"));
    console.log("CurrentAddress :", currentAddress);

    if (chainId in currentAddress) {
        if (!currentAddress[chainId].includes(raffle.address)) {
            currentAddress[chainId].push(raffle.address);
        }
    } else {
        currentAddress[chainId] = [raffle.address];
    }
    fs.writeFileSync(FRONTEND_CONTRACT_ADDRESS, JSON.stringify(currentAddress));
}

module.exports.tags = ["all", "frontend"];
