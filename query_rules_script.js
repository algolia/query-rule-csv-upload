/**
 * User: chrislebowitz
 * Date: 2019-06-17
 * Time: 09:51
 */

const algoliasearch = require('algoliasearch');
const fs = require('fs');
const csv = require('csv-parser');
const csvstring = require('csv-string');
const moment = require('moment');
const maxPromotions = 300;


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
                    const lowerCaseExtractor = (row, key) => row[key] && row[key].trim().toLowerCase();
                    const dateExtractor = (row, key) => {
                        if(row[key]){
                            const m = moment(row[key], 'MM/DD/YYYY');
                            if(m.isValid()){
                                return m.unix();
                            }
                        }
                    };
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
                        'Enabled': {
                            name: 'queryEnabled',
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
                        'Remove Words': {
                            name: 'queryRemoveWords',
                            extractor: defaultExtractor
                        },
                        'Filters': {
                            name: 'queryFilters',
                            extractor: defaultExtractor
                        },
                        'Optional Filters': {
                            name: 'queryOptionalFilters',
                            extractor: (row, key) => row[key] && csvstring.parse(row[key])
                        },
                        "Promoted Items": {
                            name: 'queryPromotionsList',
                            extractor: (row, key) => {
                                if(row[key]){
                                    const objectIds = csvstring.parse(row[key]);
                                    if(Array.isArray(objectIds) && Array.isArray(objectIds[0])){
                                        return objectIds[0].map((value, index) => {
                                            return {
                                                "objectID": value.trim(),
                                                "position": index
                                            };
                                        });
                                    }
                                }
                            }
                        },
                        "Promoted Item": {
                            name: 'queryPromotions',
                            extractor: (row, key) => {
                                let promotedItems = [];
                                for(let i = 1; i <= maxPromotions; i++){
                                    const generatedKey = key + ' ' + i;
                                    let value = defaultExtractor(row, generatedKey);
                                    if(value){
                                        promotedItems.push({
                                            "objectID": value,
                                            "position": i - 1
                                        });
                                    }
                                }
                                return promotedItems;
                            }
                        },
                        'Promoted Items Follow Filters': {
                            name: 'queryFollowsFilters',
                            extractor: lowerCaseExtractor
                        },
                        "Start Date": {
                            name: 'queryStartDate',
                            extractor: dateExtractor
                        },
                        "End Date": {
                            name: 'queryEndDate',
                            extractor: dateExtractor
                        },
                        'Alternatives': {
                            name: 'queryAlternatives',
                            extractor: lowerCaseExtractor
                        },
                        'Analytics': {
                            name: 'queryAnalytics',
                            extractor: lowerCaseExtractor
                        }
                    };

                    let reservedTerms = {};
                    for(let key in reservedTermDefinitions){
                        let definition = reservedTermDefinitions[key];
                        reservedTerms[definition.name] = definition.extractor(row, key);
                    }

                    const { queryUpdated, queryUpdatedBy, queryPatternID, queryEnabled, queryContext, queryAnchoring, queryPattern, queryReplacement, queryRemoveWords, queryFilters, queryOptionalFilters, queryPromotionsList, queryPromotions, queryStartDate, queryEndDate, queryAlternatives, queryAnalytics, queryFollowsFilters } = reservedTerms;

                    const formattedQueryPattern = queryPatternID.replace(/[^\w]/gi, '');
                    const objectID = `${queryContext}--${formattedQueryPattern}`;
                    let objectDescription = `${queryPatternID}`;
                    if(queryContext){
                        objectDescription += ` - ${queryContext}`;
                    }
                    if(queryUpdated || queryUpdatedBy){
                        objectDescription += " - updated";
                        if(queryUpdated){
                            objectDescription += ` ${queryUpdated}`;
                        }
                        if(queryUpdatedBy){
                            objectDescription += ` by ${queryUpdatedBy}`;
                        }
                    }

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

                    if(queryStartDate && queryEndDate && queryStartDate < queryEndDate){
                        rule.validity = [{
                            from: queryStartDate,
                            until: queryEndDate
                        }];
                    }

                    let consequence = {
                        params: {}
                    };
                    if(queryReplacement){
                        consequence.params.query = queryReplacement;
                    }
                    else {
                        consequence.params.query = {
                            edits: []
                        };
                        if(queryRemoveWords){
                            consequence.params.query.edits.push({
                                type: 'remove',
                                delete: queryRemoveWords
                            });
                        }
                    }

                    if(queryFilters){
                        consequence.params.filters = queryFilters;
                    }
                    if(queryOptionalFilters){
                        consequence.params.optionalFilters = queryOptionalFilters;
                    }
                    if(queryAnalytics === 'false'){
                        consequence.params.analytics = false;
                    }

                    let userData = {};
                    const keyExclusions = Object.keys(reservedTermDefinitions);
                    const arrayContains = (array, value) => {
                        return array.some((element) => value.startsWith(element));
                    };
                    for(let key in row){
                        if(row.hasOwnProperty(key) && !arrayContains(keyExclusions, key) && typeof row[key] === 'string' && row[key]){
                            userData[key] = row[key].trim();
                        }
                    }
                    if(Object.keys(userData).length > 0){
                        consequence.userData = userData;
                    }

                    if(Array.isArray(queryPromotions) && queryPromotions.length > 0){
                        consequence.promote = queryPromotions;
                    }
                    else if(Array.isArray(queryPromotionsList) && queryPromotionsList.length > 0){
                        consequence.promote = queryPromotionsList;
                    }
                    if(consequence.promote && queryFollowsFilters === 'true'){
                        consequence.filterPromotes = true;
                    }

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
                            setError(errorContainer, `An error occurred. Message: ${err.message}`);
                        }
                        else {
                            let successMessage = document.createElement('span');
                            successMessage.className = 'success';
                            successMessage.innerText = `Successfully updated ${rules.length} query ${rules.length === 1 ? 'rule' : 'rules'}.`;
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