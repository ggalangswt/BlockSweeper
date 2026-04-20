// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract BlockSweeperRegistry is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    error InvalidWeekId();

    mapping(address player => mapping(uint256 weekId => uint256 playCount)) public weeklyPlayCount;
    mapping(uint256 weekId => uint256 playCount) public weeklyTotalPlays;
    mapping(address player => uint256 timestamp) public lastPlayedAt;

    event GamePlayed(
        address indexed player,
        uint256 indexed weekId,
        uint256 weeklyPlayCount,
        uint256 weeklyTotalPlays,
        uint256 timestamp
    );

    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
    }

    function play(uint256 weekId) external whenNotPaused returns (uint256 playerWeekPlays, uint256 weekPlays) {
        if (weekId == 0) {
            revert InvalidWeekId();
        }

        playerWeekPlays = ++weeklyPlayCount[msg.sender][weekId];
        weekPlays = ++weeklyTotalPlays[weekId];
        lastPlayedAt[msg.sender] = block.timestamp;

        emit GamePlayed(msg.sender, weekId, playerWeekPlays, weekPlays, block.timestamp);
    }

    function getWeeklyStats(address player, uint256 weekId)
        external
        view
        returns (uint256 playerPlays, uint256 totalPlays, uint256 lastPlayedTimestamp)
    {
        return (weeklyPlayCount[player][weekId], weeklyTotalPlays[weekId], lastPlayedAt[player]);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
