the goal here is to make a simple webpage where a visitor can select a file
from their computer and then create a link to p2p transfer the file to
another person using the page.

the page will have two modes:

1. sender mode - a visitor comes to the page to send a file, this is the
default mode. the visitor selects a file from their computer and
the page generates a unique link that the sender can share with the
recipient.

2. receiver mode - a visitor comes to the page with a unique link
shared by the sender. the page uses the link to establish a p2p
connection with the sender and download the file directly from them.

under the hood the page will use the library

https://github.com/jeremyckahn/secure-file-transfer

to handle the p2p file transfer to the best of it's ability even if it is unreliable.

in both modes the page will provide simple instructions and a clean
user interface to guide the visitor through the process.

the page will be styled in dark mode

at the bottom of the page in both modes there will be a small debugging
console that contains verbose logs of the p2p connection and file transfer
process for troubleshooting purposes.