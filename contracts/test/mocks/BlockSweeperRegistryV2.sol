// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BlockSweeperRegistry} from "../../src/BlockSweeperRegistry.sol";

contract BlockSweeperRegistryV2 is BlockSweeperRegistry {
    function version() external pure returns (uint256) {
        return 2;
    }
}
