# E2EE-JSON

<p align="center">
  <!-- <a href="https://github.com/galin-chung-nguyen/e2ee-json/actions">
    <img alt="Tests Passing" src="https://github.com/galin-chung-nguyen/e2ee-json/workflows/Test/badge.svg" />
  </a> -->
  <a href="https://github.com/galin-chung-nguyen/e2ee-json/graphs/contributors">
    <img alt="GitHub Contributors" src="https://img.shields.io/github/contributors/galin-chung-nguyen/e2ee-json" />
  </a>
  <!-- <a href="https://codecov.io/gh/galin-chung-nguyen/e2ee-json">
    <img alt="Tests Coverage" src="https://codecov.io/gh/galin-chung-nguyen/e2ee-json/branch/main/graph/badge.svg" />
  </a> -->
  <a href="https://github.com/galin-chung-nguyen/e2ee-json/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/galin-chung-nguyen/e2ee-json?color=0088ff" />
  </a>
  <a href="https://github.com/galin-chung-nguyen/e2ee-json/pulls">
    <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/galin-chung-nguyen/e2ee-json?color=0088ff" />
  </a>
  <!-- <a href="https://securityscorecards.dev/viewer/?uri=github.com/galin-chung-nguyen/e2ee-json">
    <img alt="OpenSSF Scorecard" src="https://api.securityscorecards.dev/projects/github.com/galin-chung-nguyen/e2ee-json/badge" />
  </a> -->
</p>


This repository presents two key models for secure data management using Zero-Knowledge Proofs (ZK) and encryption. It focuses on maintaining privacy while enabling data validation by third parties without revealing the actual content.

# Models Overview
1. End-to-End Encryption Model

In this model, self-sovereign data is emphasized, where the user encrypts their own data, making them both the issuer and the holder.
The key challenge is enabling the backend to verify the validity of the encrypted data. This verification is handled using Zero-Knowledge Proofs (ZK), ensuring that the data is intact and correct without the backend needing to decrypt it.

2. Json Web ZK Model

This model introduces an issuer-holder relationship:
The issuer signs the data and sends it to a holder.
The holder generates a ZK proof for the JSON data and passes it to a third party (e.g., a backend service) for verification.
This allows for proof-based verification of private data without revealing it.
Similarities Between the Models
Both models ensure that the JSON data remains private—only the holder can view it.
A third-party verifier (e.g., the backend) uses ZK proofs to validate the data without direct access to it.

## The Role of JSON

JSON is central to both the **End-to-End Encryption Model** and the **Json Web ZK Model** due to its flexibility and widespread use.

### Key Uses:
1. **Interoperability**: JSON is lightweight, human-readable, and widely supported, making it ideal for integrating with various web services and platforms.
2. **Structured Data**: JSON’s ability to represent complex data allows secure storage of user profiles and sensitive information.
3. **Privacy Control**: Fields within JSON can be encrypted, allowing selective disclosure and Zero-Knowledge Proof (ZK proof) generation for secure validation without exposing full content.

In these models, JSON serves as the medium for organizing encrypted data and enabling privacy-preserving proofs.

# Flow
1. Issuer Generates Data: The issuer creates a signed JSON object.
2. Data Sent to Backend: The signed data is stored on the backend, which conducts a validity check using ZK proofs.
3. Holder Fetches Data: The holder retrieves the data and validates the proof of its validity.
4. Holder Generates ZK Proof: Based on a specific schema, the holder generates a ZK proof and selectively discloses certain fields to the backend for service authentication or access.
5. Backend Verifies the Proof: The backend validates the ZK proof according to its logic, ensuring the integrity of the disclosed data fields.

# Missing Pieces / Future Work
While the foundations of the models are laid out, several key areas need further development to improve the efficiency and capabilities of the system:
- Efficiency for ZK Proof Generation: faster libraries or systems are needed to make ZK proofs more scalable.
- Mechanisms for Querying on Encrypted Data: Implementing efficient and secure methods for querying encrypted data without exposing it remains a challenge.
- Witness Obfuscation & Conditional Decryption: Solutions for selectively revealing only certain parts of the encrypted data (e.g., based on context or access rights) will be essential for practical use cases.
- Fully Homomorphic Encryption (FHE): FHE would enable efficient computation and querying over the encrypted data, further enhancing privacy-preserving operations.

## Collaboration:
If you're a cryptographer, researcher, engineer, or anyone interested, feel free to reach out to me for collaboration at galin.chung.nguyen@gmail.com or create a PR into this repository. All contributions are welcome!