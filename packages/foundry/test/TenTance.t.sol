// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/TenTance.sol";
import "forge-std/console.sol";


contract TenTanceTest is Test {
  TenTance public yourContract;

  function setUp() public {
    yourContract = new TenTance();
  }

  function testEdgesLocations() public view {
    int80 lat;
    int80 lng;

    (lat, lng) = yourContract.locate(0x800000000000000000007ffFFfffFFFFfFfFfFff);
    assertEq(lat, -604462909807314587353088);
    assertEq(lng, 604462909807314587353087);

    (lat, lng) = yourContract.locate(0x0000000000000000000000000000000000000000);
    assertEq(lat, 0);
    assertEq(lng, 0);

    (lat, lng) = yourContract.locate(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF);
    console.log(lat);
    console.log(lng);
    assertEq(lat, -1);
    assertEq(lng, -1);
  }

}
