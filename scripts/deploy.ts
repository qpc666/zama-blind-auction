import { formatEther, parseEther } from "viem";
import hre from "hardhat";

async function main() {
    const [deployer] = await hre.viem.getWalletClients();
    console.log("Deploying contracts with the account:", deployer.account.address);

    const blindAuction = await hre.viem.deployContract("BlindAuction", []);

    console.log("BlindAuction deployed to:", blindAuction.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
