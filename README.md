# Query Rule CSV Upload
Manage your Algolia query rules with a CSV file 

## Requirements
* [Node.js](https://nodejs.org/)

## Installation
To run locally/in development environment:
* Download or clone this repository
* Navigate to the project root directory
* Install the required components using `npm install`
* Run `npm start` to start the Electron app 

To build:
* Download or clone this repository
* Navigate to the project root directory
* Install the required components using `npm install`
* Run the [electron-builder](https://www.electron.build/cli) command appropriate for your platform
  * For example, to build for Mac, you would run `electron-builder -m`
  * Multiple environments can be built in parallel
  
## Usage
To use the tool, 4 pieces of information are required:
1. A CSV file describing the query rules - a [template](spreadsheet-template.csv) is included in this repository
2. Your Algolia application ID
3. Your Algolia API key
    * This key must have the `editSettings` ACL - [more information on Algolia ACLs can be found here](https://www.algolia.com/doc/guides/security/api-keys/#rights-and-restrictions)
4. The name of the index on which these rules are being updated

The spreadsheet contains the following columns:
* Date Updated - a label describing when the rule was updated. This is set manually in the spreadsheet and used for tracking purposes.
* Updated By - a label describing who last updated the rule. This is set manually in the spreadsheet and used for tracking purposes.
* Query Rule ID - used as an identifier of the rule. This must be unique per context.
* Enabled - this can be set to `false` (not case sensitive) to disable a rule. Any other value will enable the rule.
* [Context](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-context) - the context for the rule
* [Anchoring](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-anchoring) - either `is`, `startsWith`, `endsWith` or `contains`
* Search Term - the term being matched
* [Replace Query](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-query) - if you want to add a consequence that replaces the query, you can set the replacement query here
* Alternatives - this can be set to `true` to enable alternatives to be considered for this rule. **Note: this feature is in beta and only available for certain Enterprise customers.**  
* All other fields will be added as custom data. For example, the template has columns named `CustomDataField1` and `CustomDataField2`, which will add custom data in the following format: 
    ```  
    {
        "CustomDataField1": "this is the data",
        "CustomDataField2": "this is the data again"
    }
    ```
    
## Contribute
To contribute to the project:
1. Clone this repository
2. Commit your changes - make sure your local repo is up to date
3. Send a pull request to the `develop` branch             