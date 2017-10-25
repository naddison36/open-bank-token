#!/bin/sh

parity --chain testchainSpec.json --config parityDevConfig.toml --no-dapps --no-ui

# generates a UI token
#parity --chain testchainSpec.json --config parityDevConfig.toml signer new-token
