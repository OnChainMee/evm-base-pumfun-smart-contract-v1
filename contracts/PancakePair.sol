// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IPancakePair.sol";

contract PancakePair is IPancakePair {
    address public token0;
    address public token1;

    receive() external payable {}

    function initialize(address _token0, address _token1) external override {
        require(token0 == address(0) && token1 == address(0), "PancakePair: ALREADY_INITIALIZED");
        require(_token0 != address(0) && _token1 != address(0), "PancakePair: ZERO_ADDRESS");
        token0 = _token0;
        token1 = _token1;
    }
}
