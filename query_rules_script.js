/**
 * User: chrislebowitz
 * Date: 2019-06-17
 * Time: 09:51
 */

const algoliasearch = require('algoliasearch');
const fs = require('fs');
const csv = require('csv-parser');
const CSVString = require('csv-string');


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
        const {fileInput, appIdInput, apiKeyInput, indexNameInput, forwardToReplicasInput} = getFields(form);
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

                    const defaultExtractor = (row, key) => row[key] && row[key].trim();
                    let reservedTermDefinitions = {
                        'Date Updated': {
                            name: 'queryUpdated',
                            extractor: defaultExtractor
                        },
                        'Updated By': {
                            name: 'queryUpdatedBy',
                            extractor: defaultExtractor
                        },
                        'Query Rule ID': {
                            name: 'queryPatternID',
                            extractor: defaultExtractor
                        },
                        'Context': {
                            name: 'queryContext',
                            extractor: defaultExtractor
                        },
                        'Anchoring': {
                            name: 'queryAnchoring',
                            extractor: (row, key) => (row[key] && row[key].trim()) || 'contains'
                        },
                        'Search Term': {
                            name: 'queryPattern',
                            extractor: defaultExtractor
                        },
                        'Replace Query': {
                            name: 'queryReplacement',
                            extractor: defaultExtractor
                        },
                        'Enabled': {
                            name: 'queryEnabled',
                            extractor: defaultExtractor
                        },
                        'Filters': {
                            name: 'queryFilters',
                            extractor: defaultExtractor
                        },
                        'Optional Filters': {
                            name: 'queryOptionalFilters',
                            extractor: (row, key) => row[key] && CSVString.parse(row[key])
                        },
                        'Alternatives': {
                            name: 'queryAlternatives',
                            extractor: (row, key) => row[key] && row[key].trim().toLowerCase()
                        }
                    };

                    let reservedTerms = {};
                    for(let key in reservedTermDefinitions){
                        let definition = reservedTermDefinitions[key];
                        reservedTerms[definition.name] = definition.extractor(row, key);
                    }

                    const {queryUpdated, queryUpdatedBy, queryPatternID, queryContext, queryAnchoring, queryPattern, queryReplacement, queryEnabled, queryFilters, queryOptionalFilters, queryAlternatives} = reservedTerms;

                    const formattedQueryPattern = queryPatternID.replace(/[^\w]/gi, '');
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

                    let consequence = {
                        params: {}
                    };
                    if(queryReplacement){
                        consequence.params.query = queryReplacement;
                    }
                    if(queryFilters){
                        consequence.params.filters = queryFilters;
                    }
                    if(queryOptionalFilters){
                        consequence.params.optionalFilters = queryOptionalFilters;
                    }
                    let userData = {};
                    const keyExclusions = Object.keys(reservedTermDefinitions);
                    for(let key in row){
                        if(row.hasOwnProperty(key) && keyExclusions.indexOf(key) === -1 && typeof row[key] === 'string'){
                            userData[key] = row[key].trim();
                        }
                    }
                    consequence.userData = userData;

                    rule.consequence = consequence;

                    rules.push(rule);
                }
                catch(e){
                    let errorMessage;
                    if(typeof e === 'string'){
                        errorMessage = e;
                    }
                    else if(typeof e.message === 'string'){
                        errorMessage = e.message;
                    }
                    setError(errorContainer, errorMessage);
                }
            })
            .on('end', () => {
                if(rules.length > 0){
                    const forwardToReplicas = forwardToReplicasInput.checked;
                    index.batchRules(rules, {forwardToReplicas: forwardToReplicas}, (err) => {
                        if(err){
                            setError(errorContainer, 'An error occurred. Message: ' + err.message);
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