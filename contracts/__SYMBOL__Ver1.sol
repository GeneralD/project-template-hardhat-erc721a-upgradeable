// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

// @author Yumenosuke Kokata (Founder / CTO)
// @title __TokenName__

import "erc721a-upgradeable/contracts/ERC721AStorage.sol";
import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721AQueryableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

contract __SYMBOL__Ver1 is
    ERC721AUpgradeable,
    ERC721ABurnableUpgradeable,
    ERC721AQueryableUpgradeable,
    OwnableUpgradeable,
    IERC2981Upgradeable
{
    using ERC721AStorage for ERC721AStorage.Layout;
    using MerkleProofUpgradeable for bytes32[];

    function initialize() public initializerERC721A initializer {
        __ERC721A_init("__TokenName__", "__SYMBOL__");
        __ERC721ABurnable_init();
        __ERC721AQueryable_init();
        __Ownable_init();

        baseURI = "$$base url$$";
        mintLimit = $$mint limit$$;
        isChiefMintPaused = false;
        isPublicMintPaused = true;
        isAllowlistMintPaused = true;
        _royaltyFraction = $$royalty fraction in percentage$$00; // $$royalty fraction in percentage$$%
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721AUpgradeable, IERC721AUpgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return interfaceId == type(IERC2981Upgradeable).interfaceId || super.supportsInterface(interfaceId);
    }

    ///////////////////////////////////////////////////////////////////
    //// ERC2981
    ///////////////////////////////////////////////////////////////////

    uint96 private _royaltyFraction;

    /**
     * @dev set royalty in percentage x 100. e.g. 5% should be 500.
     */
    function setRoyaltyFraction(uint96 royaltyFraction) external onlyOwner {
        _royaltyFraction = royaltyFraction;
    }

    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        checkTokenIdExists(tokenId)
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = owner();
        royaltyAmount = (salePrice * _royaltyFraction) / 10_000;
    }

    ///////////////////////////////////////////////////////////////////
    //// URI
    ///////////////////////////////////////////////////////////////////

    //////////////////////////////////
    //// Base URI
    //////////////////////////////////

    string public baseURI;

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    //////////////////////////////////
    //// Token URI
    //////////////////////////////////

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721AUpgradeable, IERC721AUpgradeable)
        returns (string memory)
    {
        return string(abi.encodePacked(super.tokenURI(tokenId), ".json"));
    }

    //////////////////////////////////
    //// Contract URI
    //////////////////////////////////

    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(baseURI, "index.json"));
    }

    ///////////////////////////////////////////////////////////////////
    //// Minting Tokens
    ///////////////////////////////////////////////////////////////////

    //////////////////////////////////
    //// Allowlist Mint
    //////////////////////////////////

    function allowlistMint(
        uint256 quantity,
        bool claimBonus,
        bytes32[] calldata merkleProof
    )
        external
        payable
        whenAllowlistMintNotPaused
        checkMintLimit(quantity)
        checkAllowlist(merkleProof)
        checkAllowlistMintLimit(quantity)
        checkPay(ALLOWLIST_PRICE, quantity)
    {
        _incrementNumberAllowlistMinted(msg.sender, quantity); // bonus is not included in the count
        _safeMint(msg.sender, claimBonus ? bonusQuantity(quantity) : quantity);
    }

    //////////////////////////////////
    //// Public Mint
    //////////////////////////////////

    function publicMint(uint256 quantity)
        external
        payable
        whenPublicMintNotPaused
        checkMintLimit(quantity)
        checkPay(PUBLIC_PRICE, quantity)
    {
        _safeMint(msg.sender, quantity);
    }

    //////////////////////////////////
    //// Chief Mint
    //////////////////////////////////

    function chiefMint(uint256 quantity, bytes32[] calldata merkleProof)
        external
        whenChiefMintNotPaused
        checkMintLimit(quantity)
        checkChiefsList(merkleProof)
    {
        _incrementNumberChiefMinted(msg.sender, quantity);
        _mint(msg.sender, quantity);
    }

    function chiefMintTo(
        address to,
        uint256 quantity,
        bytes32[] calldata merkleProof
    ) external whenChiefMintNotPaused checkMintLimit(quantity) checkChiefsList(merkleProof) {
        _incrementNumberChiefMinted(msg.sender, quantity);
        _safeMint(to, quantity);
    }

    //////////////////////////////////
    //// Admin Mint
    //////////////////////////////////

    function adminMint(uint256 quantity) external onlyOwner checkMintLimit(quantity) {
        _mint(msg.sender, quantity);
    }

    function adminMintTo(address to, uint256 quantity) external onlyOwner checkMintLimit(quantity) {
        _safeMint(to, quantity);
    }

    ///////////////////////////////////////////////////////////////////
    //// Minting Limit
    ///////////////////////////////////////////////////////////////////

    uint256 public mintLimit;

    function setMintLimit(uint256 _mintLimit) external onlyOwner {
        mintLimit = _mintLimit;
    }

    modifier checkMintLimit(uint256 quantity) {
        require(_totalMinted() + quantity <= mintLimit, "minting exceeds the limit");
        _;
    }

    ///////////////////////////////////////////////////////////////////
    //// Pricing
    ///////////////////////////////////////////////////////////////////

    uint256 public constant ALLOWLIST_PRICE = $$allowlist price in ether$$ ether;
    uint256 public constant PUBLIC_PRICE = $$public price in ether$$ ether;

    modifier checkPay(uint256 price, uint256 quantity) {
        require(msg.value >= price * quantity, "not enough eth");
        _;
    }

    ///////////////////////////////////////////////////////////////////
    //// Chief List
    ///////////////////////////////////////////////////////////////////

    bytes32 private _chiefsMerkleRoot;

    function setChiefList(bytes32 merkleRoot) external onlyOwner {
        _chiefsMerkleRoot = merkleRoot;
    }

    function areYouChief(bytes32[] calldata merkleProof) public view returns (bool) {
        return merkleProof.verify(_chiefsMerkleRoot, keccak256(abi.encodePacked(msg.sender)));
    }

    modifier checkChiefsList(bytes32[] calldata merkleProof) {
        require(areYouChief(merkleProof), "invalid merkle proof");
        _;
    }

    ///////////////////////////////////////////////////////////////////
    //// Allowlist
    ///////////////////////////////////////////////////////////////////

    uint256 public constant ALLOWLISTED_OWNER_MINT_LIMIT = $$allowlist mint limit per owner$$;

    bytes32 private _merkleRoot;

    function setAllowlist(bytes32 merkleRoot) external onlyOwner {
        _merkleRoot = merkleRoot;
    }

    function isAllowlisted(bytes32[] calldata merkleProof) public view returns (bool) {
        return merkleProof.verify(_merkleRoot, keccak256(abi.encodePacked(msg.sender)));
    }

    modifier checkAllowlist(bytes32[] calldata merkleProof) {
        require(isAllowlisted(merkleProof), "invalid merkle proof");
        _;
    }

    modifier checkAllowlistMintLimit(uint256 quantity) {
        require(
            numberAllowlistMinted(msg.sender) + quantity <= ALLOWLISTED_OWNER_MINT_LIMIT,
            "allowlist minting exceeds the limit"
        );
        _;
    }

    ///////////////////////////////////////////////////////////////////
    //// Allowlist Bonus
    ///////////////////////////////////////////////////////////////////

    uint256 public constant ALLOWLIST_BONUS_PER = $$allowlist mint bonus per$$;

    /**
     * @dev returns baseQuantity + bonus.
     */
    function bonusQuantity(uint256 baseQuantity) public view returns (uint256) {
        uint256 totalMinted = _totalMinted();
        require(totalMinted + baseQuantity <= mintLimit, "minting exceeds the limit");
        uint256 bonus = baseQuantity / ALLOWLIST_BONUS_PER;
        uint256 bonusAdded = baseQuantity + bonus;
        // unfortunately if there are not enough stocks, you can't earn full bonus!
        return totalMinted + bonusAdded > mintLimit ? mintLimit - totalMinted : bonusAdded;
    }

    ///////////////////////////////////////////////////////////////////
    //// Pausing
    ///////////////////////////////////////////////////////////////////

    event ChiefMintPaused();
    event ChiefMintUnpaused();
    event PublicMintPaused();
    event PublicMintUnpaused();
    event AllowlistMintPaused();
    event AllowlistMintUnpaused();

    //////////////////////////////////
    //// Chief Mint
    //////////////////////////////////

    function pauseChiefMint() external onlyOwner whenChiefMintNotPaused {
        isChiefMintPaused = true;
        emit ChiefMintPaused();
    }

    function unpauseChiefMint() external onlyOwner whenChiefMintPaused {
        isChiefMintPaused = false;
        emit ChiefMintUnpaused();
    }

    bool public isChiefMintPaused;

    modifier whenChiefMintNotPaused() {
        require(!isChiefMintPaused, "chief mint: paused");
        _;
    }

    modifier whenChiefMintPaused() {
        require(isChiefMintPaused, "chief mint: not paused");
        _;
    }

    //////////////////////////////////
    //// Public Mint
    //////////////////////////////////

    function pausePublicMint() external onlyOwner whenPublicMintNotPaused {
        isPublicMintPaused = true;
        emit PublicMintPaused();
    }

    function unpausePublicMint() external onlyOwner whenPublicMintPaused {
        isPublicMintPaused = false;
        emit PublicMintUnpaused();
    }

    bool public isPublicMintPaused;

    modifier whenPublicMintNotPaused() {
        require(!isPublicMintPaused, "public mint: paused");
        _;
    }

    modifier whenPublicMintPaused() {
        require(isPublicMintPaused, "public mint: not paused");
        _;
    }

    //////////////////////////////////
    //// Allowlist Mint
    //////////////////////////////////

    function pauseAllowlistMint() external onlyOwner whenAllowlistMintNotPaused {
        isAllowlistMintPaused = true;
        emit AllowlistMintPaused();
    }

    function unpauseAllowlistMint() external onlyOwner whenAllowlistMintPaused {
        isAllowlistMintPaused = false;
        emit AllowlistMintUnpaused();
    }

    bool public isAllowlistMintPaused;

    modifier whenAllowlistMintNotPaused() {
        require(!isAllowlistMintPaused, "allowlist mint: paused");
        _;
    }

    modifier whenAllowlistMintPaused() {
        require(isAllowlistMintPaused, "allowlist mint: not paused");
        _;
    }

    ///////////////////////////////////////////////////////////////////
    //// Aux Data
    ///////////////////////////////////////////////////////////////////

    uint64 private constant _AUX_BITMASK_ADDRESS_DATA_ENTRY = (1 << 16) - 1;
    uint64 private constant _AUX_BITPOS_NUMBER_CHIEF_MINTED = 0;
    uint64 private constant _AUX_BITPOS_NUMBER_ALLOWLIST_MINTED = 16;

    //////////////////////////////////
    //// Allowlist Mint
    //////////////////////////////////

    function numberAllowlistMinted(address owner) public view returns (uint256) {
        return (_getAux(owner) >> _AUX_BITPOS_NUMBER_ALLOWLIST_MINTED) & _AUX_BITMASK_ADDRESS_DATA_ENTRY;
    }

    function _incrementNumberAllowlistMinted(address owner, uint256 quantity) private {
        require(numberAllowlistMinted(owner) + quantity <= _AUX_BITMASK_ADDRESS_DATA_ENTRY, "quantity overflow");
        uint64 one = 1;
        uint64 aux = _getAux(owner) + uint64(quantity) * ((one << _AUX_BITPOS_NUMBER_ALLOWLIST_MINTED) | one);
        _setAux(owner, aux);
    }

    //////////////////////////////////
    //// Chief Mint
    //////////////////////////////////

    function numberChiefMinted(address owner) public view returns (uint256) {
        return (_getAux(owner) >> _AUX_BITPOS_NUMBER_CHIEF_MINTED) & _AUX_BITMASK_ADDRESS_DATA_ENTRY;
    }

    function _incrementNumberChiefMinted(address owner, uint256 quantity) private {
        require(numberChiefMinted(owner) + quantity <= _AUX_BITMASK_ADDRESS_DATA_ENTRY, "quantity overflow");
        uint64 one = 1;
        uint64 aux = _getAux(owner) + uint64(quantity) * ((one << _AUX_BITPOS_NUMBER_CHIEF_MINTED) | one);
        _setAux(owner, aux);
    }

    ///////////////////////////////////////////////////////////////////
    //// Withdraw
    ///////////////////////////////////////////////////////////////////

    address[] private _distributees;
    uint256 private _distributionRate;

    /**
     * @dev configure distribution settings.
     * max distributionRate should be 10_000 and it means 100% balance of this contract.
     * e.g. set 500 to deposit 5% to every distributee.
     */
    function setDistribution(address[] calldata distributees, uint256 distributionRate) external onlyOwner {
        require(distributionRate * distributees.length <= 10_000, "too much distribution rate");
        _distributees = distributees;
        _distributionRate = distributionRate;
    }

    function getDistribution()
        external
        view
        onlyOwner
        returns (address[] memory distributees, uint256 distributionRate)
    {
        distributees = _distributees;
        distributionRate = _distributionRate;
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        uint256 distribution = (amount * _distributionRate) / 10_000;
        for (uint256 index = 0; index < _distributees.length; index++) {
            payable(_distributees[index]).transfer(distribution);
        }
        uint256 amountLeft = amount - distribution * _distributees.length;
        payable(msg.sender).transfer(amountLeft);
    }

    //## adminForceTransferFrom
    ///////////////////////////////////////////////////////////////////
    //// Force Transfer
    ///////////////////////////////////////////////////////////////////

    // The bit mask of the `burned` bit in packed ownership.
    uint256 private constant BITMASK_BURNED = 1 << 224;
    // The bit mask of the `nextInitialized` bit in packed ownership.
    uint256 private constant BITMASK_NEXT_INITIALIZED = 1 << 225;
    // The bit position of `startTimestamp` in packed ownership.
    uint256 private constant BITPOS_START_TIMESTAMP = 160;
    // The bit position of `extraData` in packed ownership.
    uint256 private constant BITPOS_EXTRA_DATA = 232;
    // The mask of the lower 160 bits for addresses.
    uint256 private constant BITMASK_ADDRESS = (1 << 160) - 1;

    function adminForceTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external onlyOwner {
        uint256 prevOwnershipPacked = __packedOwnershipOf(tokenId);

        if (address(uint160(prevOwnershipPacked)) != from) revert TransferFromIncorrectOwner();

        (uint256 approvedAddressSlot, address approvedAddress) = __getApprovedAddress(tokenId);

        if (to == address(0)) revert TransferToZeroAddress();

        _beforeTokenTransfers(from, to, tokenId, 1);

        // Clear approvals from the previous owner.
        assembly {
            if approvedAddress {
                // This is equivalent to `delete _tokenApprovals[tokenId]`.
                sstore(approvedAddressSlot, 0)
            }
        }

        // Underflow of the sender's balance is impossible because we check for
        // ownership above and the recipient's balance can't realistically overflow.
        // Counter overflow is incredibly unrealistic as tokenId would have to be 2**256.
        unchecked {
            // We can directly increment and decrement the balances.
            --ERC721AStorage.layout()._packedAddressData[from]; // Updates: `balance -= 1`.
            ++ERC721AStorage.layout()._packedAddressData[to]; // Updates: `balance += 1`.

            // Updates:
            // - `address` to the next owner.
            // - `startTimestamp` to the timestamp of transfering.
            // - `burned` to `false`.
            // - `nextInitialized` to `true`.
            ERC721AStorage.layout()._packedOwnerships[tokenId] = __packOwnershipData(
                to,
                BITMASK_NEXT_INITIALIZED | __nextExtraData(from, to, prevOwnershipPacked)
            );

            // If the next slot may not have been initialized (i.e. `nextInitialized == false`) .
            if (prevOwnershipPacked & BITMASK_NEXT_INITIALIZED == 0) {
                uint256 nextTokenId = tokenId + 1;
                // If the next slot's address is zero and not burned (i.e. packed value is zero).
                if (ERC721AStorage.layout()._packedOwnerships[nextTokenId] == 0) {
                    // If the next slot is within bounds.
                    if (nextTokenId != ERC721AStorage.layout()._currentIndex) {
                        // Initialize the next slot to maintain correctness for `ownerOf(tokenId + 1)`.
                        ERC721AStorage.layout()._packedOwnerships[nextTokenId] = prevOwnershipPacked;
                    }
                }
            }
        }

        emit Transfer(from, to, tokenId);
        _afterTokenTransfers(from, to, tokenId, 1);
    }

    /**
     * @dev Returns the storage slot and value for the approved address of `tokenId`.
     * Copied code from base.
     */
    function __getApprovedAddress(uint256 tokenId)
        private
        view
        returns (uint256 approvedAddressSlot, address approvedAddress)
    {
        mapping(uint256 => address) storage tokenApprovalsPtr = ERC721AStorage.layout()._tokenApprovals;
        // The following is equivalent to `approvedAddress = _tokenApprovals[tokenId]`.
        assembly {
            // Compute the slot.
            mstore(0x00, tokenId)
            mstore(0x20, tokenApprovalsPtr.slot)
            approvedAddressSlot := keccak256(0x00, 0x40)
            // Load the slot's value from storage.
            approvedAddress := sload(approvedAddressSlot)
        }
    }

    /**
     * Returns the packed ownership data of `tokenId`.
     */
    function __packedOwnershipOf(uint256 tokenId) private view returns (uint256) {
        uint256 curr = tokenId;

        unchecked {
            if (_startTokenId() <= curr)
                if (curr < ERC721AStorage.layout()._currentIndex) {
                    uint256 packed = ERC721AStorage.layout()._packedOwnerships[curr];
                    // If not burned.
                    if (packed & BITMASK_BURNED == 0) {
                        // Invariant:
                        // There will always be an ownership that has an address and is not burned
                        // before an ownership that does not have an address and is not burned.
                        // Hence, curr will not underflow.
                        //
                        // We can directly compare the packed value.
                        // If the address is zero, packed is zero.
                        while (packed == 0) {
                            packed = ERC721AStorage.layout()._packedOwnerships[--curr];
                        }
                        return packed;
                    }
                }
        }
        revert OwnerQueryForNonexistentToken();
    }

    /**
     * @dev Packs ownership data into a single uint256.
     */
    function __packOwnershipData(address owner, uint256 flags) private view returns (uint256 result) {
        assembly {
            // Mask `owner` to the lower 160 bits, in case the upper bits somehow aren't clean.
            owner := and(owner, BITMASK_ADDRESS)
            // `owner | (block.timestamp << BITPOS_START_TIMESTAMP) | flags`.
            result := or(owner, or(shl(BITPOS_START_TIMESTAMP, timestamp()), flags))
        }
    }

    /**
     * @dev Returns the next extra data for the packed ownership data.
     * The returned result is shifted into position.
     */
    function __nextExtraData(
        address from,
        address to,
        uint256 prevOwnershipPacked
    ) private view returns (uint256) {
        uint24 extraData = uint24(prevOwnershipPacked >> BITPOS_EXTRA_DATA);
        return uint256(_extraData(from, to, extraData)) << BITPOS_EXTRA_DATA;
    }
    //##
    ///////////////////////////////////////////////////////////////////
    //// Utilities
    ///////////////////////////////////////////////////////////////////

    /**
     * @dev Just alias function to call balanceOf with msg.sender as an argument.
     */
    function balance() external view returns (uint256) {
        return balanceOf(msg.sender);
    }

    modifier checkTokenIdExists(uint256 tokenId) {
        require(_exists(tokenId), "tokenId not exist");
        _;
    }
}
