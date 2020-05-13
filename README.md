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
  
Copies of the application built for [Mac](dist/Query%20Rule%20Upload-mac.dmg) and [Windows](dist/Query%20Rule%20Upload-win.exe) are located in the [dist](dist) folder. 
  
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
* [Replace Query](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-query) - if you want to add a consequence that replaces the query, you can set the replacement query here.
* [Remove Words](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-delete) - this is used to remove specific words from the query. Note: this will not have any effect if "Replace Query" is set.
* [Filters](https://www.algolia.com/doc/api-reference/api-parameters/filters/) - if you want to add filters as a query parameter, you can do so here.
* [Optional Filters](https://www.algolia.com/doc/api-reference/api-parameters/optionalFilters/) - if you want to add optional filters as a query parameter, you can do so here. This should be formatted as a comma-separated list of filters.
* [Promoted Items](https://www.algolia.com/doc/guides/managing-results/refine-results/merchandising-and-promoting/how-to/promote-hits/#promoting-a-single-item) - a comma-separated list of the objectIDs you want to promote to the beginning of the result set. **Note: if you use the more granular method of promoting items mentioned below, this parameter is ignored.** 
* [Promoted Item](https://www.algolia.com/doc/guides/managing-results/refine-results/merchandising-and-promoting/how-to/promote-hits/#promoting-a-single-item) - if you want to promote a specific objectID, you can create a column specifying where you want to promote it. For example, to promote an item to the 3rd position, you can add a column named `Promoted Item 3`. **Note: This parameter overrides the "Promoted Items" parameter mentioned previously.**
* [Promoted Items Follow Filters](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-filterpromotes) - determines whether the promoted items follow filters. Defaults to `false` - set to `true` to enable this functionality. **Note: this column will be ignored if no items are promoted.**
* [Start Date](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-timerange) - the start date of the query rule, in MM/DD/YYYY format. **Note: This value will be ignored if no end date is entered, or if the start date is after the end date.**
* [End Date](https://www.algolia.com/doc/api-reference/api-methods/save-rule/#method-param-timerange) - the end date of the query rule, in MM/DD/YYYY format. **Note: This value will be ignored if no start date is entered, or if the end date is before the start date.**
* Alternatives - this can be set to `true` to enable alternatives to be considered for this rule. **Note: this feature is in beta and only available for certain Enterprise customers.**
* Analytics - setting this to `false` will add a custom query parameter consequence setting the [analytics query parameter](https://www.algolia.com/doc/api-reference/api-parameters/analytics/) to false.
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
2. Commit your changes - make sure your local repository is up to date
3. Send a pull request to the `develop` branch             