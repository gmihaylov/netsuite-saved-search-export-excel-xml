/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        'N/ui/serverWidget',
        './NetSuiteSavedSearchExportExcelXML_SL_Config',
        'N/search',
        'N/file',
        './lib/handlebars',
        'N/log'
    ],

    (
        ui,
        CONFIG,
        search,
        file,
        Handlebars,
        log
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            if(scriptContext.request.method === 'GET') {
                const form = ui.createForm({
                    title: CONFIG.APP.NAME,
                    hideNavBar: false
                });

                form.addField({
                    id: CONFIG.SUITELET.FIELDS.SAVED_SEARCH.ID,
                    type: ui.FieldType.INTEGER,
                    label: CONFIG.SUITELET.FIELDS.SAVED_SEARCH.LABEL
                });

                form.addSubmitButton(CONFIG.SUITELET.BUTTONS.GENERATE.LABEL);

                scriptContext.response.writePage(form);
            }

            if(scriptContext.request.method === 'POST') {
                const savedSearchId =
                    scriptContext.request.parameters[CONFIG.SUITELET.FIELDS.SAVED_SEARCH.ID];

                const savedSearchResults = getSavedSearchResults(savedSearchId);
                const file = createExcelFile(savedSearchResults, `Saved Search ${savedSearchId} Export.xls`);

                scriptContext.response.writeFile(file);
            }

        }

        let createExcelFile = (savedSearchResults, fileName) => {
            let hbTemplate = Handlebars.compile(
                file.load({
                    id: CONFIG.APP.TEMPLATE_FILE_PATH
                }).getContents()
            );

            hbTemplate = hbTemplate(savedSearchResults);

            return file.create({
                name: fileName,
                fileType: file.Type.PLAINTEXT,
                contents: hbTemplate
            });
        }

        const getSavedSearchResults = (searchId) => {
            const savedSearch = search.load({
                id: searchId
            });
            const columns = savedSearch.columns;

            const results = {
                columns: columns.reduce(function (accumulator, column) {
                    accumulator.push(column.label);
                    return accumulator;
                },[]),
                rows: []
            };

            const pagedData = savedSearch.runPaged();
            pagedData.pageRanges.forEach(function(pageRange){
                const page = pagedData.fetch({index: pageRange.index});
                page.data.forEach(function(result){
                    const row = [];
                    columns.forEach(function (column, index) {
                        row[index] = result.getValue(column);
                    });
                    results.rows.push(row);
                });
            });

            return results;
        }

        return {onRequest}

    });
