#!/bin/sh

# Used for testing
geth --datadir ../testchain --unlock 0xF55583FF8461DB9dfbBe90b5F3324f2A290c3356,0x0013a861865d784d97c57e70814b13ba94713d4e,0x8Ae386892b59bD2A7546a9468E8e847D61955991,0x2c7536E3605D9C16a7a3D7b1898e529396a65c23,0xd9d72d466637e8408bb3b17d3ff6db02e8bebf27 --password ./testpassword --rpc --rpcapi "eth,net,web3,debug" --rpccorsdomain '*' --rpcport 8646 --ws --wsport 8647 --wsaddr "localhost" --wsorigins="*" --port 32323 --mine --minerthreads 1 --maxpeers 0 --cache 1024 --targetgaslimit 994712388 --verbosity 2 console

# used for production
#geth --unlock 6 --ws --wsport 8647 --wsaddr "localhost" --wsorigins="*" --verbosity 2 console

