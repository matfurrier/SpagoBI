var app = angular.module('hierManager');

app.controller('hierMasterController', ["sbiModule_config","sbiModule_logger","sbiModule_translate","$scope","$mdDialog","sbiModule_restServices","$mdDialog",masterControllerFunction ]);

var nodeStructure = {
		name:'node',
		id:'node',
		root: false,
		children: [],
		type: 'folder',
		visible : true,
		checked : false,
		$parent: null,
		expanded : false
		};

function masterControllerFunction (sbiModule_config,sbiModule_logger,sbiModule_translate, $scope, $mdDialog, sbiModule_restServices,$mdDialog){
	
	$scope.translate = sbiModule_translate;
	$scope.restService = sbiModule_restServices;
	$scope.log = sbiModule_logger;
	$scope.hierarchiesType = ['Master', $scope.translate.load('sbi.hierarchies.type.technical')];
	$scope.hierarchiesMap = {};
	$scope.keys = {'subfolders' : 'children'};
	$scope.orderByFields = ['name','id'];
	
	$scope.dimensions = [];
	$scope.seeFilterDim = false;
	$scope.dateDim = new Date();
	$scope.dimensionsTable = [];
	$scope.columnsTable = [];
	$scope.columnSearchTable = [];
	$scope.metadataDimMap = {};
	
	$scope.hierTree = [];
	$scope.dateTree = new Date();
	$scope.metadataTreeMap = {};
	$scope.treeMasterDirty=false;
	$scope.masterIsNew = false;
	
	$scope.hierMasterNew = {};
	
	$scope.dimSpeedMenu= [{
    	label: $scope.translate.load('sbi.generic.details'),
    	icon:'fa fa-info-circle',
    	color:'#153E7E',
    	action:function(item,event){
    		$scope.showDetails(item);
    	}
 	}];

	$scope.tableOptions = {
		beforeDrop : function(e){
			$scope.showListHierarchies().then(
				function(data){
					var source = e.source.cloneModel;
					var dest = e.dest.nodeScope !== undefined ? e.dest.nodeScope.$modelValue : e.dest.nodesScope.$modelValue;
					var tmp = angular.copy(nodeStructure);
					if (dest.length > 0){
						tmp.$parent = dest[0].$parent
						tmp.type = dest[0].type;
					}else{
						tmp.$parent = null;
					}
					source.name = source.CDC_NM; //TODO problem matching left side with right side. the field are different
					source.id = source.CDC_CD;
					var keys = Object.keys(tmp);
					for (var i =0; i< keys.length;i++){
						if (source[keys[i]] == undefined){
							source[keys[i]] = tmp[keys[i]];
						}
					}
					if ( Array.isArray(dest)){
						dest.unshift(source);
					}
				},function(){}
			);
		}
   }	
	
	$scope.hierTree.push(angular.copy(dataJson));
	
	$scope.restService.get("dimensions","getDimensions")
		.success(
			function(data, status, headers, config) {
				$scope.dimensions=angular.copy(data);
			})	
		.error(function(data, status){
			var message = 'GET dimensions error of ' + data + ' with status :' + status;
			$scope.showAlert('ERROR',message);
			
		});
	
	$scope.getDimensionsTable = function(filterDate,filterHierarchy){
		if ($scope.dateDim && $scope.dim){
			var dateFormatted = $scope.formatDate($scope.dateDim);
			var config = {};
			config.params = {
					dimension : $scope.dim.DIMENSION_NM,
					validityDate : dateFormatted
			}
			if (filterDate !== undefined && filterDate !== null){
				config.params.filterDate = filterDate;
			}
			if (filterHierarchy !== undefined && filterHierarchy !== null){
				config.params.filterHierarchy = filterHierarchy;
			}
			$scope.restService.get("dimensions","dimensionData",null,config)
				.success(
					function(data, status, headers, config) {
						if (data.error == undefined){
							$scope.createTable(data);
							$scope.hierType = undefined;
							$scope.hierarchiesMaster = [];
						}else{
							$scope.showAlert('ERROR',data.error[0].message);
						}
					})	
				.error(function(data, status){
					var message = 'GET dimension table error of ' + data + ' with status :' + status;
					$scope.showAlert('ERROR', message);
			});
		}
		$scope.getDimMetadata($scope.dim);
		$scope.getTreeMetadata($scope.dim);
	}
	
	$scope.getDimMetadata = function (dim){
		if (dim){
			var dimName = $scope.dim.DIMENSION_NM;
			if ($scope.metadataDimMap !== undefined && $scope.metadataDimMap[dimName] == undefined){
				$scope.restService.get("dimensions","dimensionMetadata","dimension="+dimName)
				.success(
					function(data, status, headers, config) {
						if (data.errors === undefined){
							$scope.metadataDimMap[dimName] = data;
						}else{
							$scope.showAlert('ERROR',data.errors[0].message);
						}
				})
				.error(function(data, status){
					var message = 'GET hierarchies error of ' + type +'-'+ dimName + ' with status :' + status;
					$scope.showAlert('ERROR',message);
				});
			}
		}
	}
	
	$scope.createTable = function(data){
		$scope.dimensionsTable = data.root;
		$scope.columnsTable.splice(0,$scope.columnsTable.length);
		for (var i = 0;i<data.columns.length;i++){
			if (data.columns[i].VISIBLE == true || data.columns[i].VISIBLE == "true"){
				$scope.columnsTable.push({ 'label' : data.columns[i].NAME, 'name': data.columns[i].ID});
			}
		}
		$scope.columnSearchTable = data.columns_search;
	}
	
	//$scope.createTable(dataRoot);
	
	$scope.getHierarchies = function (){
		var type = $scope.hierType;
		var dim = $scope.dim;
		var map = $scope.hierarchiesMap; 
		if (type !== undefined && dim !== undefined){
			var dimName = dim.DIMENSION_NM;
			var keyMap = type+'_'+dimName; 
			var serviceName = (type.toUpperCase() == 'AUTO' || type.toUpperCase() == 'MASTER' )? 'getHierarchiesMaster' : 'getHierarchiesTechnical';
			
			//if the hierarchies[dim][type] is not defined, get the hierarchies and save in the map. Else, get them from the map 
			if (map[keyMap] === undefined){
				$scope.restService.get("hierarchies",serviceName,"dimension="+dimName)
					.success(
						function(data, status, headers, config) {
							if (data.errors === undefined){
								map[keyMap] = data;
								$scope.hierarchiesMaster =  angular.copy(data);
							}else{
								$scope.showAlert('ERROR',data.errors[0].message);
							}
						})
					.error(function(data, status){
						var message='GET hierarchies error of ' + type +'-'+ dimName + ' with status :' + status;
						$scope.showAlert('ERROR',message);
						
					});
			}else{
				$scope.hierarchiesMaster = map[keyMap];
			}
		}
		//get the metadata for the tree
		$scope.getTreeMetadata(dim);
	}
	
	$scope.getTreeMetadata = function(dim){
		if (dim !== undefined){
			var dimName = dim.DIMENSION_NM;
			if ($scope.metadataTreeMap !== undefined && $scope.metadataTreeMap[dimName] == undefined){
				$scope.restService.get("hierarchies","nodeMetadata","dimension="+dimName+"&excludeLeaf=false")
				.success(
					function(data, status, headers, config) {
						if (data.errors === undefined){
							$scope.metadataTreeMap[dimName] = data;
						}else{
							$scope.showAlert('ERROR',data.errors[0].message);
						}
				})
				.error(function(data, status){
					var message = 'GET hierarchies error of ' + type +'-'+ dimName + ' with status :' + status;
					$scope.showAlert('ERROR',message);
				});
			}
		}
	}
	
	$scope.getTree = function(dateFilter,seeElement){
		var type = $scope.hierType;
		var dim = $scope.dim;
		var date = $scope.dateTree;
		var hier = $scope.hierMaster;
		if (type && dim && hier && date){
			var dateFormatted =$scope.formatDate(date);
			var keyMap = type + '_' + dim.DIMENSION_NM + '_' + hier.HIER_NM + '_' + dateFormatted;
			var config = {};
			config.params = {
				dimension: dim.DIMENSION_NM,
				filterType : type,
				filterHierarchy : hier.HIER_NM,
				validityDate : dateFormatted
			};
			if (dateFilter !== undefined && dateFilter!== null && dateFilter.length > 0){
				config.params.filterDate = ''+dateFilter;
				keyMap = keyMap + '_' + dateFilter;
			}
			if (seeElement == true){
				config.params.filterDimension = seeElement;
				keyMap = keyMap + '_' + seeElement;
			}
			if (!$scope.hierarchiesMap[keyMap]){
				$scope.restService.get("hierarchies","getHierarchyTree",null,config)
					.success(
						function(data, status, headers, config) {
							if (data !== undefined && data.errors === undefined){
								if (typeof data =='object'){
									data = [data];
								}
								$scope.hierTree = data;
								$scope.hierarchiesMap = data;
								$scope.IsNew = false;
							}else{
								var params = 'date = ' + date + ' dimension = ' + dim.DIMENSION_NM + ' type = ' +  type + ' hierachies = ' + hier.HIER_NM;
								$scope.showAlert('ERROR',data.errors[0].message);
							}
						})
					.error(function(data, status){
						var params = 'date = ' + date + ' dimension = ' + dim.DIMENSION_NM + ' type = ' +  type + ' hierachies = ' + hier.HIER_NM;
						var message='GET tree source error with parameters' + params + ' with status: "' + status+ '"';
						$scope.showAlert('ERROR',message);
					});
			}else{
				$scope.hierTree = $scope.hierarchiesMap[keyMap];
			}
		}	
	}
	
	$scope.crateMasterHier = function (){
		var dialog = $scope.showCreateMaster();
		dialog.then(function(data){
			//TODO save received data = {hierNew, metadata}
		},function(){});
	}
	
	$scope.showCreateMaster = function(){
		
		if ($scope.dim && $scope.dateDim){
			var dimName = $scope.dim.DIMENSION_NM;
			if (!$scope.metadataTreeMap[dimName]){
				$scope.getTreeMetadata($scope.dim);
			}
			return $mdDialog.show({
					templateUrl: sbiModule_config.contextName +'/js/src/angular_1.4/tools/hierarchies/templates/newHierMasterDialog.html',
					parent: angular.element(document.body),
					locals: {
						   translate: $scope.translate,
				           date : $scope.dateDim,
				           dim: $scope.dim,
				           metadataDim : $scope.metadataDimMap[dimName].DIM_FIELDS,
				           metadataTree : $scope.metadataTreeMap[dimName].GENERAL_FIELDS
				         },
					preserveScope : true,
					clickOutsideToClose:false,
					controller: newHierarchyController 
				});
		}
	}

	$scope.showDetails = function(item) {
		return $mdDialog.show({
				templateUrl: sbiModule_config.contextName +'/js/src/angular_1.4/tools/hierarchies/templates/detailsMasterDialog.html',
				parent: angular.element(document.body),
				locals: {
					   translate: $scope.translate,
					   item: item,
			           metadataDim : $scope.metadataDimMap[$scope.dim.DIMENSION_NM].DIM_FIELDS
			         },
				preserveScope : true,
				clickOutsideToClose:false,
				controller: showDetailsController
			});
	}
	
	$scope.showListHierarchies = function() {
		return $mdDialog.show({
				templateUrl: sbiModule_config.contextName +'/js/src/angular_1.4/tools/hierarchies/templates/listHierarchiesDialog.html',
				parent: angular.element(document.body),
				locals: {
					   translate: $scope.translate
			         },
				preserveScope : true,
				clickOutsideToClose:false,
				controller: showListHierarchyController
			});
	}
	
	$scope.applyFilter = function(choose){
		//use to apply the filter only when is clicked the icon
		var date = $scope.dateFilterTree;
		var seeElement = $scope.seeHideLeafTree;
		var dateFormatted;
		if (date !== undefined){
			dateFormatted = $scope.formatData(date);
		}
		//get the Tree if one off two filters are active
		if ((seeElement !== undefined &&  seeElement != false) || (dateFormatted !== undefined && dateFormatted.length>0)){
			$scope.getTree(dateFormatted, seeElement);
		}
		//apply filter on source side (left) or Tree side (right)
		$scope.filterByTreeTrigger = angular.copy($scope.filterByTree);
		$scope.orderByTreeTrigger = angular.copy($scope.orderByTree);
	}
	
	$scope.removeFilter = function(choose){
		$scope.filterByTreeTrigger = "";
		$scope.filterByTree = "";
		$scope.orderByTreeTrigger = "";
		$scope.orderByTree = "";
		//get tree without filters if they were active
		if (($scope.seeHideLeafTree !== undefined &&  $scope.seeHideLeafTree != false) || ($scope.dateFilterTree !== undefined && $scope.dateFilterTree.length>0)){
			$scope.getTree();
		}
		$scope.dateFilterTree = undefined;
		$scope.seeHideLeafTree = false;
	}
	
	$scope.toogleSeeFilter= function(choose){
		if (choose == 'dim'){
			$scope.seeFilterDim = !$scope.seeFilterDim;
		}else{
			$scope.seeFilterTree = !$scope.seeFilterTree;
		}
	}
	
	$scope.formatDate = function (date){
		return date.getFullYear() + '-' + date.getMonth()+'-'+ date.getDate();
	}
	
	function showListHierarchyController($scope, $mdDialog, translate) {
			$scope.translate = translate;
			
			$scope.closeDialog = function() {
		     	$mdDialog.hide();
		    }
			$scope.cancelDialog = function() {
		     	$mdDialog.cancel();
		     }
	 } 
	 
	function showDetailsController($scope, $mdDialog, translate, item, metadataDim) {
		$scope.translate = translate;
		$scope.item = item;
		$scope.metadataDim = angular.copy(metadataDim);
		
		$scope.closeDialog = function() {
	     	$mdDialog.cancel();
	     }
	}
	
	function newHierarchyController($scope, $mdDialog, translate, item, metadataDim, metadataTree) {
		$scope.translate = translate;
		$scope.dim = {};
		$scope.date = date;
		$scope.metadataDim = angular.copy(metadataDim);
		$scope.metadataTree = angular.copy(metadataTree);
	    $scope.selectedItemsLeft = [];
	    $scope.selectedItemsRight = [];
	    $scope.metadataDimExport = [];
	    var level = 1 ;
	    $scope.removeElement = function (array, el){
    		for ( var i = 0 ; i < array.length ; i++){
    			if (array[i].ID == el.ID){
	    			array.splice(i,1);
    			}
    		}
	    }
	    //move selected item from posSelected to posDestination if they are set and different
	    $scope.moveTo = function (posDestination){
	    	if (posDestination && posDestination.length > 0){
    			var dest = posDestination == 'right' ? $scope.metadataDimExport :$scope.metadataDim;
    			var source = posDestination == 'right' ?  $scope.metadataDim : $scope.metadataDimExport;
    			var itemsSource = posDestination == 'right' ?  $scope.selectedItemsLeft : $scope.selectedItemsRight;
    			if (source.length > 0){
    				var count = 0;
    				var tmpLevel = -1;
    				for (var i = 0 ; i < itemsSource.length;i++){
						itemsSource[i].level = posDestination == 'right' ?  level : undefined;
    					dest.push(itemsSource[i]);
    					$scope.removeElement(source,itemsSource[i]);
	    				itemsSource[i].isSelected = undefined;
    				}
    				itemsSource.splice(0,itemsSource.length);
    				//if move to right, rise the level
    				//if move to left, decrease the level of the element with bigger level 
    				if (posDestination == 'right'){
    					level++;
    				}else if (posDestination == 'left'){
    					//check if the highest level is missing, in this case, decrease the level
    					//could be missing because the highest level could be moved
    					var isPresent = false;
    					for (var i=0;i<source.length;i++){
    						if (source[i].level == (level-1)){
    							isPresent=true;
    							break;
    						}
    					}
    					if (!isPresent){
    						level--;
    					}
    				}
    				
    			}
	    	}
	    }
	  
	    $scope.toogleItem = function (item,pos){
	    	item.isSelected = item.isSelected == undefined ? true : !item.isSelected;
	    	var arraySelected = pos == 'right' ? $scope.selectedItemsRight : $scope.selectedItemsLeft;
	    	if (item.isSelected == true){
	    		arraySelected.push(item);
	    	}else{
	    		$scope.removeElement(arraySelected, item);
	    	}
	    }
	    
		$scope.closeDialog = function() {
	     	$mdDialog.cancel();
	     }
	    $scope.saveHier = function(){
	     	$mdDialog.hide(
	     			{hierNew : $scope.hierNew,
	     			 metadata: $scope.metadataDimExport
	     			});
	     }
	}

	//Create an alert dialog with a message
	$scope.showAlert = function (title, message){
		$scope.log.log(message);
		//if angular material version < 1.0.0_rc5 not has textContent function
		if (typeof $mdDialog.alert().textContent == 'function'){
			$mdDialog.show( 
				$mdDialog.alert()
			        .parent(angular.element(document.body))
			        .clickOutsideToClose(false)
			        .title(title)
			        .textContent(message) //FROM angular material 1.0 
			        .ok('Ok')
				);
		}else {
			$mdDialog.show( 
				$mdDialog.alert()
			        .parent(angular.element(document.body))
			        .clickOutsideToClose(false)
			        .title(title)
			        .content(message)
			        .ok('Ok')
		        );
		}
	};
}

