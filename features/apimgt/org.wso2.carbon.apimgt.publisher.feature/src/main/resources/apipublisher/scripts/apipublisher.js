/*
 * Copyright (c) 2005-2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

//TODO add proper introduction to the module
var apipublisher = {};

(function (apipublisher) {

    var APIManagerFactory = Packages.org.wso2.carbon.apimgt.impl.APIManagerFactory;
    var APISubscriber = Packages.org.wso2.carbon.apimgt.api.model.Subscriber;
    var APIIdentifier = Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier;
    var API= Packages.org.wso2.carbon.apimgt.api.model.API;
    var Application=Packages.org.wso2.carbon.apimgt.api.model.Applications;
    var APIUtil = Packages.org.wso2.carbon.apimgt.impl.utils.APIUtil;
    var Date = Packages.java.util.Date;
    var Tier= Packages.org.wso2.carbon.apimgt.api.model.Tier;
    var URITemplate= Packages.org.wso2.carbon.apimgt.api.model.URITemplate;

    var Set=Packages.java.util.Set;
    var List=Packages.java.util.List;
    var ArrayList=Packages.java.util.ArrayList;
    var Iterator=Packages.java.util.Iterator;
    var String=Packages.java.lang.String;
    var Object=Packages.java.lang.Object;
    var Map=Packages.java.util.Map;
    var Long=Packages.java.lang.Long;
    var HashMap=Packages.java.util.HashMap;
    var HashSet=Packages.java.util.HashSet;
    var JSONArray=Packages.org.json.simple.JSONArray;
    var JSONValue=Packages.org.json.simple.JSONValue;

    var DateFormat=Packages.java.text.DateFormat;
    var SimpleDateFormat=Packages.java.text.SimpleDateFormat;

    var log = new Log("jaggery-modules.api-manager.publisher");
    //Defining constant fields
    var API_PROVIDER = "provider";
    var API_NAME = "name";
    var API_VERSION = "version";
    var API_CUSTOM_PROPERTY_PREFIX = "overview_newproperty";

    var APIManagerFactory = Packages.org.wso2.carbon.apimgt.impl.APIManagerFactory;
    var log = new Log("jaggery-modules.api-manager.publisher");

    function APIProviderProxy(username) {
        this.username = username;
        this.impl = APIManagerFactory.getInstance().getAPIProvider(this.username);
    }

    apipublisher.instance = function(username){
        return new APIProviderProxy(username);
    };

    APIProviderProxy.prototype.getAllProviders = function () {
    	var providers = [];

    	try{
    		providerSet = this.impl.getAllProviders();
    		for (var i = 0 ; i < providerSet.size(); i++) {
    			var provider = providerSet.get(i);
        		providers.push({
        			"name":provider.getName(),
        			"email":provider.getEmail(),
        			"description":provider.getDescription()
        		});
            }
    		return {
                error:false,
                providers:providers
            };
    	}catch(e){
    		log.error(e.message);
            return {
                error:e,
                providers:null
            };
    	}

    };

    APIProviderProxy.prototype.createAPI = function (api) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(api.provider, api.name, api.version);
        var uuid;
        try {
            uuid = this.impl.createAPI(identifier, api.context);
            if (log.isDebugEnabled()) {
                log.debug("Error while creating API" );
            }
            return {
                error:false,
                uuid:uuid
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.implementAPI = function (api) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(api.provider, api.apiName, api.version);
        var apiOb = new Packages.org.wso2.carbon.apimgt.api.model.API(identifier);
        apiOb.setImplementation(api.implementation_type);
        apiOb.setWsdlUrl(api.wsdl);
        apiOb.setWadlUrl(api.wadl);
        if('secured' == api.endpointSecured) {
            apiOb.setEndpointSecured(true);
        } else {
            apiOb.setEndpointSecured(false);
        }
        apiOb.setEndpointUTUsername(api.endpointUTUsername);
        apiOb.setEndpointUTPassword(api.endpointUTPassword);
        apiOb.setEndpointConfig(api.endpoint_config);
        apiOb.setDestinationStatsEnabled(api.destinationStats);
        apiOb.setSwagger(api.swagger);
        return this.impl.updateAPIImplementation(apiOb);
    };

    APIProviderProxy.prototype.updateDesignAPI = function (api) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(api.provider, api.name, api.version);
        var apiOb = new Packages.org.wso2.carbon.apimgt.api.model.API(identifier);
        apiOb.setContext(api.context);
        apiOb.setDescription(api.description);
        apiOb.setVisibility(api.visibility);
        apiOb.setVisibleRoles(api.visibleRoles);
        apiOb.setThumbnailUrl(api.thumbnailUrl);
        return this.impl.updateAPIDesign(apiOb,  api.tags, api.swagger);
    };

    APIProviderProxy.prototype.addDocumentation = function (api, document) {
        return this.impl.addDocumentation(api);
    };

    APIProviderProxy.prototype.addInlineContent = function (api, docName, content) {
        return this.impl.addInlineContent(api, docName, content);
    };

    APIProviderProxy.prototype.createNewAPIVersion = function (api, newVersion) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(api.provider, api.name, api.version);
        var apiOb = new Packages.org.wso2.carbon.apimgt.api.model.API(identifier);
        if('default_version' == api.defaultVersion) {
            apiOb.setAsDefaultVersion(true);
        } else {
            apiOb.setAsDefaultVersion(false);
        }
        return this.impl.createNewAPIVersion(apiOb, newVersion);
    };

    APIProviderProxy.prototype.getAllAPIUsageByProvider = function (providerName) {
    	var apisJSON;
    	try{
    		apisArray = this.impl.getAllAPIUsageByProvider(providerName);
    		var json = APIUtil.convertToString(apisArray);
    		if(json != null){
    			apisJSON = JSON.parse(json);
    			//log.info(json);
    		}

    		/*for (var i = 0 ; i < apisArray.size(); i++) {
    			var usage = pisArray.get(i);
    			var apiSubscriptionsArray = usage.getApiSubscriptions();
    			var apiSubscriptions = [];
    			for(var y = 0 ; y < apiSubscriptionsArray.size(); y++){
    				var apiSubscription = apiSubscriptions.get(y);
    				apiSubscriptions.push({
    					"status": apiSubscription.getSubStatus()

    				});
    			}
    			apis.push({
    				"userId": usage.getUserId(),
    				"applicationName":subscriber.getName(),
                    "subStatus": subscriber.getDescription(),
                    "accessToken": new Date(subscriber.getSubscribedDate().getTime()),
                    "accessTokenStatus": subscriber.getId(),
                    "apiSubscriptions": apiSubscriptions


    			});
            }*/

    		return {
                error:false,
                apis:apisJSON
            };
    	}catch(e){
    		log.error(e.message);
            return {
                error:e,
                apis:null
            };
    	}

    };

    APIProviderProxy.prototype.getSubscribersOfAPI = function (apiId) {
    	var subscribers = [];
    	try{
    		subscriberSet = this.impl.getSubscribersOfAPI(apiId);
    		for (var i = 0 ; i < subscriberSet.size(); i++) {
    			var subscriber = subscriberSet.get(i);
    			subscribers.push({
    				"name":subscriber.getName(),
                    "description": subscriber.getDescription(),
                    "subscribedDate": new Date(subscriber.getSubscribedDate().getTime()),
                    "id": subscriber.getId(),
                    "tenantId": subscriber.getTenantId(),
                    "email": subscriber.getEmail()
                });
            }
    		return {
                error:false,
                subscribers:subscribers
            };
    	}catch(e){
    		log.error(e.message);
            return {
                error:e,
                subscribers:subscribers
            };
    	}

    };

    APIProviderProxy.prototype.getAPIsByProvider = function (providerName) {
    	apis = this.impl.getAPIsByProvider(providerName);
    	var apisJSON = JSON.parse(APIUtil.convertToString(apis));
        return apisJSON;
    };

    /*
     * This method returns the subscription details needed for api-subscriptions page.
     */
    APIProviderProxy.prototype.getSubscribersOfAPI = function (provider, name, version) {
        var apiObj = new Packages.org.json.simple.JSONObject();
        apiObj.put("provider", provider);
        apiObj.put("name", name);
        apiObj.put("version", version);
        var subscribers = [];
    	try{
    		subscriberSet = this.impl.getSubscribersOfAPI(apiObj);
    		for (var i = 0 ; i < subscriberSet.size(); i++) {
    			var subscriber = subscriberSet.get(i);
    			subscribers.push({
    				"name":subscriber.getName(),
                    "description": subscriber.getDescription(),
                    "subscribedDate": new Date(subscriber.getSubscribedDate().getTime()),
                    "id": subscriber.getId(),
                    "tenantId": subscriber.getTenantId(),
                    "email": subscriber.getEmail()
                });
            }
    		return {
                error:false,
                subscribers:subscribers
            };
    	}catch(e){
    		log.error(e.message);
            return {
                error:e,
                subscribers:subscribers
            };
    	}


    };

    /*
     * This method returns the UUID of an artifact
     */
    APIProviderProxy.prototype.getUUIDByApi = function (provider, name, version) {
        return this.impl.getUUIDByApi(provider, name, version);
    };

    APIProviderProxy.prototype.getDefaultVersion = function (apiId) {
        return this.impl.getDefaultVersion(apiId);
    };

    APIProviderProxy.prototype.getCustomFaultSequences = function () {
        var sequences = [];
        try {
            sequencesList = this.impl.getCustomFaultSequences();
            for (var i = 0 ; i < sequencesList.size(); i++) {
                sequences.push(sequencesList.get(i));
            }
            //log.info(sequences);
            if (log.isDebugEnabled()) {
                log.debug("getCustomOutSequences " +  " : " + sequences);
            }

            return {
                error:false,
                sequences:sequences
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e,
                sequences:null
            };
        }
    };

    APIProviderProxy.prototype.getCustomInSequences = function () {
        var sequences = [];
        try {
            sequencesList = this.impl.getCustomInSequences();
            for (var i = 0 ; i < sequencesList.size(); i++) {
                sequences.push(sequencesList.get(i));
            }
            //log.info(sequences);
            if (log.isDebugEnabled()) {
                log.debug("getCustomOutSequences " +  " : " + sequences);
            }

            return {
                error:false,
                sequences:sequences
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e,
                sequences:null
            };
        }
    };

    APIProviderProxy.prototype.getCustomOutSequences = function () {
        var sequences = [];
        try {
            sequencesList = this.impl.getCustomOutSequences();
            for (var i = 0 ; i < sequencesList.size(); i++) {
                sequences.push(sequencesList.get(i));
            }
            //log.info(sequences);
            if (log.isDebugEnabled()) {
                log.debug("getCustomOutSequences " +  " : " + sequences);
            }

            return {
                error:false,
                sequences:sequences
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e,
                sequences:null
            };
        }
    };


    APIProviderProxy.prototype.getEnvironments = function () {
        var environments;
        var environmentList = [];
        //log.info('=================================');
        try {
            environments = APIUtil.getEnvironments();
            var environment;
            var iterator = environments.values().iterator();
            while(iterator.hasNext()) {
                //log.info('+++++++++++++++++++++++++++++==');
                environment = iterator.next();
                environmentList.push({
                                         "name" : environment.getName(),
                                         "description"  : environment.getDescription(),
                                         "type"       : environment.getType()
                                     });
            }
            //log.info(environmentList);
            //log.info('=================================');
            if (log.isDebugEnabled()) {
                log.debug("getCustomOutSequences " +  " : " + sequences);
            }

            return {
                error:false,
                environments:environmentList
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e,
                environments:null
            };
        }
    };

    /*
     * This method is used to update the application wise and user wise subscription status
     */
    APIProviderProxy.prototype.updateSubscription = function (apiProvider, apiName, apiVersion, appId, status) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(apiProvider, apiName, apiVersion);
        return this.impl.updateSubscription(identifier, status, parseInt(appId));
    };

    APIProviderProxy.prototype.removeDocumentation = function (apiId, docName, docType) {
        return this.impl.removeDocumentation(apiId, docName, docType);
    };

    /**
     * Delete a API
     * @param apiProvider name of the api provider
     * @param apiName name of the api to be removed
     * @param version the version of the api to be removed
     * @returns {boolean} whether successfully removed or not
     */
    APIProviderProxy.prototype.deleteAPI = function (apiProvider, apiName, apiVersion) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(apiProvider, apiName, apiVersion);
        var success, log = new Log();
        try {
            success = result = this.impl.deleteAPI(identifier);
            if (log.isDebugEnabled()) {
                log.debug("Error while deleting the API : " + apiName + " : " + exists);
            }
            return {
                error:false,
                success:success
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.getAPI = function (apiProvider, apiName, apiVersion) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(apiProvider, apiName, apiVersion);
        var defaultVersion = this.getDefaultVersion(identifier);
        var hasDefaultVersion = (defaultVersion != null);
        var apiOb;
        try {
            api = this.impl.getAPI(identifier);
            var subscriberCount = this.impl.getSubscriberCount(identifier);
            var tiers = api.getTierSetAsArray();
            var tierSet = '';
            var tiersDisplayNamesSet = '';
            var tiersDescSet = '';
            for(var i = 0; i < tiers.length; i++) {
                tierSet += tiers[i].getName();
                tiersDisplayNamesSet += tiers[i].getDisplayName();
                tiersDescSet += tiers[i].getDescription();
                if (i != tierSet.length - 1) {
                    tierSet += ',';
                    tiersDisplayNamesSet += ',';
                    tiersDescSet += ',';
                }
            }

            var uriTemplates = api.getUriTemplates();
            if (uriTemplates.size() != 0) {
                var uriTempArr = new Array();
                var iterator = uriTemplates.iterator();
                var uriTemplatesArr = new Array();
                while (iterator.hasNext()) {
                    var utArr = new Array();
                    var ut = iterator.next();
                    utArr.push(ut.getUriTemplate());
                    utArr.push(ut.getMethodsAsString().replaceAll("\\s", ","));
                    utArr.push(ut.getAuthTypeAsString().replaceAll("\\s", ","));
                    utArr.push(ut.getThrottlingTiersAsString().replaceAll("\\s", ","));
                    var utNArr = new Array();
                    for (var p = 0; p < utArr.length; p++) {
                        utNArr.push(utArr[p]);
                    }
                    uriTemplatesArr.push(utNArr);
                }

                for (var c = 0; c < uriTemplatesArr.length; c++) {
                    uriTempArr.push(uriTemplatesArr[c]);
                }
            }

            var externalStoresSet = this.impl.getExternalAPIStores(identifier);
            var store;
            var storeList = [];
            if(externalStoresSet != null && externalStoresSet.size() != 0) {
                var iterator = externalStoresSet.iterator();
                while (iterator.hasNext()) {
                    store = iterator.next();
                    storeList.push({
                                       "name": store.getName(),
                                       "displayName": store.getDisplayName(),
                                       "published": store.isPublished()
                                   });
                }
            }

            var resourceArray = new Array();
            if (uriTemplates.size() != 0) {
                var iterator = uriTemplates.iterator();
                while (iterator.hasNext()) {
                    var resourceObj =[];
                    var ut = iterator.next();
                    resourceObj.push({
                                         "resourceObj" : ut.getUriTemplate(),
                                         "http_verbs"  : JSONValue.parse(ut.getResourceMap())
                                     });
                    resourceArray.push(resourceObj);
                }
            }

            var scopes = api.getScopes();
            var scopesNative = new Array();
            var iterator = scopes.iterator();
            if(scopes != null) {
                while (iterator.hasNext()) {
                    var scopeNative = [];
                    scopeNative.push({
                                         "id": scope.getId(),
                                         "key": scope.getKey(),
                                         "name": scope.getName(),
                                         "roles": scope.getRoles(),
                                         "description": scope.getDescription()
                                     });
                    scopesNative.push(scopeNative);
                }
            }

            var propertiesMap = new Packages.java.util.HashMap();
            propertiesMap = api.getApiProperties();
            var apiProperty;
            var apiPropertyJson = [];
            if (propertiesMap != null && propertiesMap.size() != 0) {
                var iterator = propertiesMap.entrySet().iterator();
                while (iterator.hasNext()) {
                    apiProperty = iterator.next();
                    var key = apiProperty.getKey();
                    var value = apiProperty.getValue();

                    var displayName = key.replace(API_CUSTOM_PROPERTY_PREFIX, '');
                    // Converting display name to a sentence
                    var labelNameWithSpace = displayName.replaceAll(
                        String.format("%s|%s|%s",
                            "(?<=[A-Z])(?=[A-Z][a-z])",
                            "(?<=[^A-Z])(?=[A-Z])",
                            "(?<=[A-Za-z])(?=[^A-Za-z])"
                        ),
                        " "
                    );
                    // Converting first letter in sentence to uppercase
                    var labelName = labelNameWithSpace.substring(0, 1).toUpperCase() + labelNameWithSpace.substring(1);
                    apiPropertyJson.push({
                        "key": key,
                        "value": value,
                        "notSelectedValues": null,
                        "labelName": labelName,
                        "displayName": displayName
                    });
                }
            }

            apiOb = {
                name: api.getId().getApiName(),
                description: api.getDescription(),
                url: api.getUrl(),
                wsdl: api.getWsdlUrl(),
                version: api.getId().getVersion(),
                tags: api.getTagSetAsString(),
                availableTiers: tierSet,
                status: api.getStatus().toString(),
                thumb: APIUtil.getWebContextRoot(api.getThumbnailUrl()),
                context: api.getContext(),
                lastUpdated: Long.valueOf(api.getLastUpdated().getTime()).toString(),
                subs: subscriberCount,
                templates: uriTempArr,
                sandbox: api.getSandboxUrl(),
                tierDescs:tiersDescSet,
                bizOwner: api.getBusinessOwner(),
                bizOwnerMail: api.getBusinessOwnerEmail(),
                techOwner: api.getTechnicalOwner(),
                techOwnerMail: api.getTechnicalOwnerEmail(),
                wadl: api.getWadlUrl(),
                visibility: api.getVisibility(),
                roles: api.getVisibleRoles(),
                tenants: api.getVisibleTenants(),
                epUsername: api.getEndpointUTUsername(),
                epPassword: api.getEndpointUTPassword(),
                endpointTypeSecured: api.isEndpointSecured(),
                provider: APIUtil.replaceEmailDomainBack(api.getId().getProviderName()),
                transport_http: APIUtil.checkTransport("http", api.getTransports()),
                transport_https: APIUtil.checkTransport("https", api.getTransports()),
                apiStores: storeList,
                inSequence: api.getInSequence(),
                outSequence: api.getOutSequence(),
                subscriptionAvailability: api.getSubscriptionAvailability(),
                subscriptionTenants: api.getSubscriptionAvailableTenants(),
                endpointConfig: api.getEndpointConfig(),
                responseCache: api.getResponseCache(),
                cacheTimeout: api.getCacheTimeout(),
                availableTiersDisplayNames: tiersDisplayNamesSet,
                faultSequence: api.getFaultSequence(),
                destinationStats: api.getDestinationStatsEnabled(),
                resources: JSONValue.toJSONString(resourceArray),
                scopes: scopesNative,
                isDefaultVersion: api.isDefaultVersion(),
                implementation: api.getImplementation(),
                hasDefaultVersion: hasDefaultVersion,
                environments: APIUtil.writeEnvironmentsToArtifact(api),
                currentDefaultVersion: defaultVersion,
                apiProperties: apiPropertyJson
            };
            return {
                error:false,
                api:apiOb
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e,
                api:null,
                message:e.message.split(":")[1]
            };
        }
    };

    APIProviderProxy.prototype.getAllDocumentation = function (apiId) {
        return this.impl.getAllDocumentation(apiId);
    };

    APIProviderProxy.prototype.getAllDocumentation = function (apiId) {
        return this.impl.getAllDocumentation(apiId);
    };

    APIProviderProxy.prototype.getInlineContent = function (apiId, docName) {
        return this.impl.getDocumentationContent(apiId, docName);
    };

    APIProviderProxy.prototype.getTiers = function (tenantDomain) {

        var tierList = new Array();
        try {
            var availableTiers = this.impl.getTiers(tenantDomain);
            var tierList = [];
            var tier;
            var sortedTierList = APIUtil.sortTiers(availableTiers);
            for (var i = 0 ; i < sortedTierList.size() ; i ++) {
                tier = sortedTierList.get(i);
                tierList.push({
                                  "tierName": tier.getName(),
                                  "tierDisplayName": tier.getDisplayName(),
                                  "tierDescription": tier.getDescription(),
                                  "defaultTier": 0
                              });
            }
            if (log.isDebugEnabled()) {
                log.debug("Invoke getTiers()" );
            }
            return {
                error:false,
                tiers:tierList
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.getSubscriberAPIs = function (subscriberName) {
        return this.impl.getSubscriberAPIs(subscriberName);
    };

    APIProviderProxy.prototype.checkIfAPIExists = function (apiProvider, apiName, apiVersion) {

        var exists;
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(apiProvider, apiName, apiVersion);
        try {
            exists = this.impl.checkIfAPIExists(identifier);
            if (log.isDebugEnabled()) {
                log.debug("Error while checking api exist for : " + apiName + " : " + exists);
            }
            return {
                error:false,
                exist:exists
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.isSynapseGateway = function () {
        var result;
        try {
            result = this.impl.isSynapseGateway();
            if (log.isDebugEnabled()) {
                log.debug("Invoke getExternalAPIStores()" );
            }
            return {
                error:false,
                isSynapseGateway:result
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.getSwagger20Definition = function (apiProvider, apiName, apiVersion) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(apiProvider, apiName, apiVersion);
        var data;
        try {
            data = JSON.parse(this.impl.getSwagger20Definition(identifier));
            if (log.isDebugEnabled()) {
                log.debug("Error while getting swagger20 resource" );
            }
            return {
                error:false,
                data:data
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.isMultipleTenantsAvailable = function(){
        try {
            result = this.impl.isMultipleTenantsAvailable();
            if (log.isDebugEnabled()) {
                log.debug("Invoke isMultipleTenantsAvailable()" );
            }
            return {
                error:false,
                status:result
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:true,
                message:e
            };
        }
    };

    APIProviderProxy.prototype.manageAPI = function (api) {
        var success;
        var log = new Log();
        //log.info(api);
        try {
            var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(api.provider, api.apiName, api.version);
            var apiOb = new Packages.org.wso2.carbon.apimgt.api.model.API(identifier);

            var tierSet = new HashSet();
            var tierArray = api.tier.split(',');
            var tier;
            for (var i = 0 ; i < tierArray.length; i++) {
                tier = new Tier(tierArray[i]);
                tierSet.add(tier);
            }

            var environments = APIUtil.extractEnvironmentsForAPI(api.environments);

            apiOb.addAvailableTiers(tierSet);
            apiOb.setSubscriptionAvailability(api.subscriptionAvailability);
            apiOb.setSubscriptionAvailableTenants(api.subscriptionTenants);
            if('default_version' == api.defaultVersion) {
                apiOb.setAsDefaultVersion(true);
            } else {
                apiOb.setAsDefaultVersion(false);
            }
            apiOb.setTransports(api.transports);
            apiOb.setInSequence(api.inSequence);
            apiOb.setOutSequence(api.outSequence);
            apiOb.setFaultSequence(api.faultSequence);
            apiOb.setBusinessOwner(api.bizOwner);
            apiOb.setBusinessOwnerEmail(api.bizOwnerMail);
            apiOb.setTechnicalOwner(api.techOwner);
            apiOb.setTechnicalOwnerEmail(api.techOwnerMail);
            apiOb.setEnvironments(environments);
            apiOb.setResponseCache(api.responseCache);
            apiOb.setCacheTimeout(api.cacheTimeout);
            apiOb.setSwagger(api.swagger);

            var propertiesMap = new Packages.java.util.HashMap();
            apiProperties = api.properties;
            for (var key=0; key < apiProperties.length; key++) {
                propertiesMap.put(apiProperties[key].split('-')[0],apiProperties[key].split('-')[1]);
            }
            apiOb.setApiProperties(propertiesMap);

            success = this.impl.updateAPIManagePhase(apiOb);
            if (log.isDebugEnabled()) {
                log.debug("manageAPI : " + api.name + "-" + api.version);
            }
            if(success){
                return {
                    error:false
                };
            }else{
                return {
                    error:true
                }; }
        } catch (e) {
            log.error(e);
            return {
                error:true,
                message:e.message.replace(e.message.split(":")[0] + ":", "")
            };
        }
    };

    APIProviderProxy.prototype.isApiNameExist = function (apiName) {
        var exists, log = new Log();
        try {
            exists = result = this.impl.isApiNameExist(apiName);
            if (log.isDebugEnabled()) {
                log.debug("isApiName exist for : " + apiName + " : " + exists);
            }
            return {
                error:false,
                exist:exists
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.isContextExist = function (context, oldContext) {
        var exists, log = new Log();
        if(context == oldContext) {
            return {
                error:false,
                exist:true
            };
        }

        try {
            exists = this.impl.isDuplicateContextTemplate(context);
            if (log.isDebugEnabled()) {
                log.debug("isContext exist for : " + context + " : " + exists);
            }
            return {
                error:false,
                exist:exists
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.isURLValid = function (type,url) {
        var result, valid = false, log = new Log();
        try {
            result = APIUtil.isURLValid(type,url);
            if(result == 'success') {
                valid = true;
            }
            if (log.isDebugEnabled()) {
                log.debug("Invoke isURLValid" );
            }
            return {
                error:false,
                response:result,
                valid : valid
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.validateRoles = function(roles) {

        var validRole, log = new Log();
        var roleList ;
        if(roles != null && !roles == '') {
            roleList = roles.split(',');
        } else {
            return {
                error:true,
                valid: false,
                errorMsg : 'Please provide non empty roles set to valid'
            };
        }

        try {
            validRole = this.impl.validateRoles(roleList);
            if (log.isDebugEnabled()) {
                log.debug("Invoke validateRoles function.");
            }
            return {
                error:false,
                valid: validRole
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.updateAPIStatus = function (api) {
        var log = new Log();
        try {
            var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(api.provider, api.apiName, api.version);
            var success = this.impl.updateAPIStatus(identifier, api.status, api.deprecateOldVersions, api.makeKeysForwardCompatible);
            if (log.isDebugEnabled()) {
                log.debug("updateAPIStatus : " + api.name + "-" + api.version);
            }
            if (!success) {
                return {
                    error:true
                };
            } else {
                return {
                   error:true,
                   message:success + '||warning'
                };
            }
        } catch (e) {
            log.error(e.message);
            return {
                error:true,
                message:e.message.split(":")[1]
            };
        }
    };

    APIProviderProxy.prototype.hasPublishPermission = function () {
        var success, log = new Log();
        try {
            success = this.impl.hasPublishPermission();
            if (log.isDebugEnabled()) {
                log.debug("check whether user has publisher permission" );
            }
            if(success){
                return {
                    error:false,
                    permitted:success
                };
            }else{
                return {
                    error:true,
                    permitted:success
                }; }
        } catch (e) {
            log.error(e.message);
            return {
                error:true,
                permitted:false
            };
        }
    };

    APIProviderProxy.prototype.isScopeExist = function (scope, tenantId) {
        var result, log = new Log();
        try {
            result = this.impl.isScopeKeyExist(scope, tenantId);
            if (log.isDebugEnabled()) {
                log.debug("Invoke isScopeExist()" );
            }
            return {
                error:false,
                isScopeExist:result
            };
        } catch (e) {
            log.error(e.message);
            return {
                error:e
            };
        }
    };

    APIProviderProxy.prototype.isAPIOlderVersionExist = function (apiProvider, apiName, apiVersion) {
        var identifier = new Packages.org.wso2.carbon.apimgt.api.model.APIIdentifier(apiProvider, apiName, apiVersion);
        try {
            var exist = this.impl.isAPIOlderVersionExist(identifier);
            if (log.isDebugEnabled()) {
                log.debug("isAPIOlderVersionExist : " + api.name + "-" + api.version);
            }
            if (!exist) {
                return {
                    error:true,
                    exist:false
                };
            } else {
                return {
                    error:false,
                    exist:true
                };
            }

        } catch (e) {
            log.error(e.message);
            return {
                error:e,
                exist:false,
                message:e.message.split(":")[1]

            };
        }
    };
})(apipublisher);

