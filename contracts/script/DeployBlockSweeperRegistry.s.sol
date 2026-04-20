// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {BlockSweeperRegistry} from "../src/BlockSweeperRegistry.sol";

contract DeployBlockSweeperRegistry is Script {
    function run() external returns (BlockSweeperRegistry implementation, ERC1967Proxy proxy) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        implementation = new BlockSweeperRegistry();
        proxy = new ERC1967Proxy(
            address(implementation), abi.encodeCall(BlockSweeperRegistry.initialize, (owner))
        );

        vm.stopBroadcast();
    }
}
