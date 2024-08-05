//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title A smart contract that computes a 2D location from an address
 * @author challet
 */
contract TenTance {
  /**
   * @param addr The address to which compute a location
   * @return lat vertical axis coordinate, between - 604 462 909 807 314 587 353 088 and + 604 462 909 807 314 587 353 087
   * @return lng horizontal axis coordinate, between - 604 462 909 807 314 587 353 088 and + 604 462 909 807 314 587 353 087
   */
  function locate(address addr) public pure returns (int80 lat, int80 lng) {
    uint160 int_addr = uint160(addr);

    lat = int80(uint80(int_addr >> 80));
    lng = int80(uint80(int_addr));

    return (lat, lng);
  }

}
