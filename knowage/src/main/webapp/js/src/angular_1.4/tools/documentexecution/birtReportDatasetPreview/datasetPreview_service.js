/*
Knowage, Open Source Business Intelligence suite
Copyright (C) 2019 Engineering Ingegneria Informatica S.p.A.

Knowage is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

Knowage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function(){
	
	angular.module('datasetPreviewModule')
			.service('datasetPreview_service', ['$httpParamSerializer', '$mdDialog', 'sbiModule_config', 'sbiModule_restServices', 
				function($httpParamSerializer, $mdDialog, sbiModule_config, sbiModule_restServices){
				
				this.previewDataset = function(datasetLabel, parameters, directDownload) {
					if(!directDownload){
						var iframeSrcUrl = sbiModule_config.contextName + "/restful-services/2.0/datasets/preview";
						
						var config = {
							datasetLabel: datasetLabel
						};
						
						if (parameters == null || parameters == undefined) {
							showExporters(config);
							iframeSrcUrl += '?' + $httpParamSerializer(config);
							openPreviewDialog(iframeSrcUrl, datasetLabel);
						} else {
							sbiModule_restServices.promiseGet('2.0/datasets', datasetLabel)
									.then(function(response){
										var previewDataset = response.data[0];
										
										if (previewDataset.pars.length > 0) {
											for(var i = 0; i < previewDataset.pars.length; i++) {
												var value = parameters[0][previewDataset.pars[i].name];
												previewDataset.pars[i].value = value;
											}
											config.parameters = previewDataset.pars;
											showExporters(config);
											iframeSrcUrl += '?' + $httpParamSerializer(config);
										}
										openPreviewDialog(iframeSrcUrl, datasetLabel);
									});
						}	
					}else{
						sbiModule_restServices.promiseGet('2.0/datasets', datasetLabel)
						.then(function(response){
							var previewDataset = response.data[0];
							if (parameters == null || parameters == undefined) {
								sbiModule_restServices.promisePost('/2.0/export/dataset'/+ previewDataset.id.dsId + '/csv')
								.then(function(response){})
							}else{
								for(var i = 0; i < previewDataset.pars.length; i++) {
									var value = parameters[0][previewDataset.pars[i].name];
									previewDataset.pars[i].value = value;
								}
								sbiModule_restServices.promisePost('/2.0/export/dataset'/+ previewDataset.id.dsId + '/csv?PARAMETERS=' +encodeURIComponent(JSON.stringify(previewDataset.pars)))
										.then(function(response){})
							}
						})
					}
						
				}
						
				
				var openPreviewDialog = function(iframeSrcUrl, datasetLabel) {
					$mdDialog.show({
						parent: angular.element(document.body),
						locals: {iframeSrcUrl: iframeSrcUrl, dsLabel: datasetLabel},
						template: '<md-dialog style="height:80%;width:80%">'+
						'   <md-toolbar><div class="md-toolbar-tools"><h2>Dataset Preview: &nbsp; {{datasetLabel}}</h2></div></md-toolbar>'+
						'   <md-dialog-content flex>'+
						'       <iframe ng-if="previewUrl" ng-src="{{previewUrl}}" style="width:100%;height:100%;border:0;"></iframe>'+
						'   </md-dialog-content>'+
						'   <md-dialog-actions layout="row">'+
						'       <span flex></span>'+
						'       <md-button class="md-raised md-primary" ng-click="closePreview()">Close</md-button>'+
						'   </md-dialog-actions>'+
						'</md-dialog>',
						controller: function(scope, iframeSrcUrl, dsLabel) {
							scope.previewUrl = iframeSrcUrl;
							scope.datasetLabel = dsLabel;
							
							scope.closePreview = function() {
								$mdDialog.hide();
							}
						},
						clickOutsideToClose: true
					}).then(function(response){}, function(response){});
				}
				
				var showExporters = function(config) {
					config.options = {
						exports: ['CSV', 'XLSX']
					};
				}
				
			}]);
		
})();