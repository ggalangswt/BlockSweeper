// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {BlockSweeperRegistry} from "../src/BlockSweeperRegistry.sol";
import {BlockSweeperRegistryV2} from "./mocks/BlockSweeperRegistryV2.sol";

contract BlockSweeperRegistryTest is Test {
    BlockSweeperRegistry internal implementation;
    BlockSweeperRegistry internal registry;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal mallory = makeAddr("mallory");

    uint256 internal constant WEEK_ONE = 1;
    uint256 internal constant WEEK_TWO = 2;

    event GamePlayed(
        address indexed player,
        uint256 indexed weekId,
        uint256 weeklyPlayCount,
        uint256 weeklyTotalPlays,
        uint256 timestamp
    );

    function setUp() public {
        implementation = new BlockSweeperRegistry();
        registry = _deployProxy(owner);
    }

    function test_InitializeSetsOwnerAndDefaults() public view {
        assertEq(registry.owner(), owner);
        assertFalse(registry.paused());
        assertEq(registry.weeklyPlayCount(alice, WEEK_ONE), 0);
        assertEq(registry.weeklyTotalPlays(WEEK_ONE), 0);
        assertEq(registry.lastPlayedAt(alice), 0);
    }

    function test_RevertWhen_InitializingProxyTwice() public {
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        registry.initialize(owner);
    }

    function test_RevertWhen_InitializingImplementationDirectly() public {
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        implementation.initialize(owner);
    }

    function test_PlayIncrementsPlayerAndWeekCounters() public {
        vm.warp(11);
        vm.prank(alice);
        (uint256 playerWeekPlays, uint256 weekPlays) = registry.play(WEEK_ONE);

        assertEq(playerWeekPlays, 1);
        assertEq(weekPlays, 1);
        assertEq(registry.weeklyPlayCount(alice, WEEK_ONE), 1);
        assertEq(registry.weeklyTotalPlays(WEEK_ONE), 1);
        assertEq(registry.lastPlayedAt(alice), 11);
    }

    function test_PlayEmitsExpectedEvent() public {
        vm.warp(42);
        vm.expectEmit(true, true, false, true);
        emit GamePlayed(alice, WEEK_ONE, 1, 1, 42);

        vm.prank(alice);
        registry.play(WEEK_ONE);
    }

    function test_PlayRepeatedlyInSameWeekAccumulates() public {
        vm.startPrank(alice);
        registry.play(WEEK_ONE);
        registry.play(WEEK_ONE);
        registry.play(WEEK_ONE);
        vm.stopPrank();

        assertEq(registry.weeklyPlayCount(alice, WEEK_ONE), 3);
        assertEq(registry.weeklyTotalPlays(WEEK_ONE), 3);
    }

    function test_PlayAcrossDifferentWeeksKeepsBucketsSeparated() public {
        vm.startPrank(alice);
        registry.play(WEEK_ONE);
        registry.play(WEEK_TWO);
        vm.stopPrank();

        assertEq(registry.weeklyPlayCount(alice, WEEK_ONE), 1);
        assertEq(registry.weeklyPlayCount(alice, WEEK_TWO), 1);
        assertEq(registry.weeklyTotalPlays(WEEK_ONE), 1);
        assertEq(registry.weeklyTotalPlays(WEEK_TWO), 1);
    }

    function test_PlayAcrossDifferentUsersAggregatesTotalPerWeek() public {
        vm.prank(alice);
        registry.play(WEEK_ONE);

        vm.prank(bob);
        registry.play(WEEK_ONE);

        vm.prank(alice);
        registry.play(WEEK_ONE);

        assertEq(registry.weeklyPlayCount(alice, WEEK_ONE), 2);
        assertEq(registry.weeklyPlayCount(bob, WEEK_ONE), 1);
        assertEq(registry.weeklyTotalPlays(WEEK_ONE), 3);
    }

    function test_GetWeeklyStatsReturnsCurrentState() public {
        vm.warp(88);
        vm.prank(alice);
        registry.play(WEEK_TWO);

        (uint256 playerPlays, uint256 totalPlays, uint256 lastPlayedTimestamp) =
            registry.getWeeklyStats(alice, WEEK_TWO);

        assertEq(playerPlays, 1);
        assertEq(totalPlays, 1);
        assertEq(lastPlayedTimestamp, 88);
    }

    function test_RevertWhen_PlayUsesWeekZero() public {
        vm.prank(alice);
        vm.expectRevert(BlockSweeperRegistry.InvalidWeekId.selector);
        registry.play(0);
    }

    function test_PauseBlocksPlay() public {
        vm.prank(owner);
        registry.pause();

        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        registry.play(WEEK_ONE);
    }

    function test_UnpauseRestoresPlay() public {
        vm.startPrank(owner);
        registry.pause();
        registry.unpause();
        vm.stopPrank();

        vm.prank(alice);
        registry.play(WEEK_ONE);

        assertEq(registry.weeklyPlayCount(alice, WEEK_ONE), 1);
    }

    function test_RevertWhen_NonOwnerPauses() public {
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, mallory));
        registry.pause();
    }

    function test_RevertWhen_NonOwnerUnpauses() public {
        vm.prank(owner);
        registry.pause();

        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, mallory));
        registry.unpause();
    }

    function test_OwnerCanUpgradeAndStatePersists() public {
        vm.prank(alice);
        registry.play(WEEK_ONE);

        BlockSweeperRegistryV2 v2Implementation = new BlockSweeperRegistryV2();

        vm.prank(owner);
        UUPSUpgradeable(address(registry)).upgradeToAndCall(address(v2Implementation), "");

        BlockSweeperRegistryV2 upgraded = BlockSweeperRegistryV2(address(registry));
        assertEq(upgraded.version(), 2);
        assertEq(upgraded.weeklyPlayCount(alice, WEEK_ONE), 1);
        assertEq(upgraded.weeklyTotalPlays(WEEK_ONE), 1);
        assertEq(upgraded.owner(), owner);
    }

    function test_RevertWhen_NonOwnerUpgrades() public {
        BlockSweeperRegistryV2 v2Implementation = new BlockSweeperRegistryV2();

        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, mallory));
        UUPSUpgradeable(address(registry)).upgradeToAndCall(address(v2Implementation), "");
    }

    function test_ManyPlayersAndWeeksMaintainConsistentCounters() public {
        address[] memory players = new address[](4);
        players[0] = alice;
        players[1] = bob;
        players[2] = mallory;
        players[3] = makeAddr("charlie");

        for (uint256 weekId = 1; weekId <= 6; weekId++) {
            uint256 expectedTotal;
            for (uint256 i = 0; i < players.length; i++) {
                uint256 plays = weekId + i;
                expectedTotal += plays;
                for (uint256 j = 0; j < plays; j++) {
                    vm.prank(players[i]);
                    registry.play(weekId);
                }
                assertEq(registry.weeklyPlayCount(players[i], weekId), plays);
            }
            assertEq(registry.weeklyTotalPlays(weekId), expectedTotal);
        }
    }

    function testFuzz_PlayAccumulatesPerAddressAndWeek(address player, uint8 times, uint256 weekId) public {
        vm.assume(player != address(0));
        vm.assume(times > 0);
        vm.assume(weekId > 0 && weekId < type(uint64).max);

        for (uint256 i = 0; i < times; i++) {
            vm.prank(player);
            registry.play(weekId);
        }

        assertEq(registry.weeklyPlayCount(player, weekId), times);
        assertEq(registry.weeklyTotalPlays(weekId), times);
    }

    function _deployProxy(address initialOwner) internal returns (BlockSweeperRegistry proxyInstance) {
        bytes memory initData = abi.encodeCall(BlockSweeperRegistry.initialize, (initialOwner));
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        proxyInstance = BlockSweeperRegistry(address(proxy));
    }
}
