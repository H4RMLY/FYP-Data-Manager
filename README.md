# Final Year Project - Personal Data Manager 📝
## What is it?
  This proof of concept data manager aims to make data subjects better data controllers by allowing them to make GDPR requests from a central location. 
  The applciaiton also servers as decentralised data store so that users can track their data on a device that they own and control instead of relying 
  on companies like lastpass to do this for them.
### Applicaiton Side
  This contains a data manager server and webpage.
### Dependancies
- MySQL server running on the same machine as the applicaiton.
- Node.js
### Vendor Client
  This is a sample vendor client that interacts and sends data to the manager.
### Dependancies
- Node.js
## Features
- ### Data Manager ID
  An ID system that allows individual data managers to be identified and communicated with.
- ### Vendor List
  A list that displays all information about all vendors that have access to the users data.
- ### User Data List
  A list of all data that is held by vendors with labels of which vendors have access to it.
- ### Data Verification Tab
  A Tab used to verify new data entering the manager so the user can verify if it is theirs .
- ### Delete Data
  A button on the user data list that allows the user to delete a piece of data from all vendors.
- ### Edit Data
  A button on the user data list that allows the user to edit a piece of data for all vendors who store it.
- ### Delete Vendor
  A button on the vendor list that deletes all data a vendor holds.
- ### Awaiting data Tab
  A tab that shows all data that is awaiting confirmation from a vendor that a decision has been fulfilled.
- ### Vendor Counter
  A counter at the top of the vendor list that displays how many vendors have access to the users data.
- ### Vendor Filter
  A filter that allows the user to refine the information they see on the vendor list.
- ### User Data Filter
  A filter that allows the user to refine the information they see on the user data list.


