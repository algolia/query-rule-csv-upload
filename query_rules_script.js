/**
 * User: chrislebowitz
 * Date: 2019-06-17
 * Time: 09:51
 */

const algoliasearch = require('algoliasearch');
const fs = require('fs');
const csv = require('csv-parser');


(function(){
    const getInputs = (form) => {
        const inputs = form.getElementsByTagName('input');
        return [...inputs];
    };

    const getFields = (form) => {
        return getInputs(form).reduce((obj, item) => {
            obj[item.name + 'Input'] = item;
            return obj;
        }, {});
    };

    const isValid = (form) => {
        const inputs = getInputs(form);
        for(let i = 0; i < inputs.length; i++){
            const input = inputs[i];
            if(!input.value){
                return false;
            }
        }
        return true;
    };

    const setError = (errorContainer, text) => {
        errorContainer.innerText = text;
    };

    const resetError = (errorContainer) => {
        setError(errorContainer, '');
    };

    const processForm = (form, errorContainer) => {
        const {fileInput, appIdInput, apiKeyInput, indexNameInput} = getFields(form);
        const client = algoliasearch(appIdInput.value, apiKeyInput.value);
        const index = client.initIndex(indexNameInput.value);
        let rules = [];

        const file = fileInput.files[0];
        fs.createReadStream(file.path, {
            autoclose: true,
            flags: 'r'
        })
            .pipe(csv())
            .on('data', (row) => {
                try {
                    let rule = {};
                    const queryUpdated = row['Date Updated'].trim();
                    const queryUpdatedBy = row['Updated By'].trim();
                    const queryPatternID = row['Query Rule ID'].trim();
                    const queryContext = row['Context'] && row['Context'].trim();
                    const queryAnchoring = (row['Anchoring'] && row['Anchoring'].trim()) || 'contains';
                    const queryPattern = row['Search Term'].trim();
                    const queryReplacement = row['Replace Query'].trim();
                    const queryEnabled = row['Enabled'].trim();
                    const queryAlternatives = row['Alternatives'] && row['Alternatives'].trim().toLowerCase();


                    const formattedQueryPattern = queryPatternID.replace(/\s+/g, '-');
                    const objectID = queryContext + "--" + formattedQueryPattern;
                    const objectDescription = `${queryPatternID} - ${queryContext} - updated ${queryUpdated} by ${queryUpdatedBy}`;

                    rule.objectID = objectID;
                    rule.description = objectDescription;
                    rule.enabled = typeof queryEnabled !== 'string' || queryEnabled.toLowerCase() !== 'false';
                    rule.condition = {
                        pattern: queryPattern,
                        anchoring: queryAnchoring,
                        alternatives: queryAlternatives === 'true'
                    };
                    if(queryContext){
                        rule.condition.context = queryContext;
                    }

                    let consequence = {};
                    if(queryReplacement){
                        consequence.params = {
                            query: queryReplacement
                        };
                    }
                    let userData = {};
                    //TODO figure out how to make use this list above
                    const keyExclusions = ['Date Updated', 'Updated By', 'Query Rule ID', 'Context', 'Anchoring', 'Search Term', 'Replace Query', 'Enabled', 'Alternatives'];
                    for(let key in row){
                        if(row.hasOwnProperty(key) && keyExclusions.indexOf(key) === -1 && typeof row[key] === 'string'){
                            userData[key] = row[key].trim();
                        }
                    }

                    let formattedUserData = {};
                    for(let key in userData){
                        if(userData.hasOwnProperty(key)){
                            formattedUserData[key.toLowerCase()] = userData[key];
                        }
                    }
                    userData = {};
                    userData[queryContext || 'Context'] = {
                        'banner-1': formattedUserData
                    };

                    consequence.userData = userData;

                    rule.consequence = consequence;

                    rules.push(rule);
                }
                catch(e){
                    setError(e.message);
                }
            })
            .on('end', () => {
                if(rules.length > 0){
                    index.batchRules(rules, (err) => {
                        if(err){
                            setError(errorContainer, 'An error occurred. Message:' + err.message);
                        }
                        else {
                            let successMessage = document.createElement('span');
                            successMessage.className = 'success';
                            successMessage.innerText = 'Successfully updated ' + rules.length + ' query rules.';
                            errorContainer.innerHTML = successMessage.outerHTML;
                        }
                    });
                }
            });
    };

    const form = document.getElementById('csv-upload-form');
    form.addEventListener('submit', (event) => {
        const errorContainer = document.getElementById('errors');
        if(!isValid(form)){
            setError(errorContainer, 'Please enter values in all of the fields.');
        }
        else {
            resetError(errorContainer);
            processForm(form, errorContainer);
        }
        event.preventDefault();
    });
})();