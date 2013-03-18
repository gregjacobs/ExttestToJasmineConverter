/*global require, module */
var Node = require( './Node' );


/**
 * @class node.SetUp
 * 
 * Represents an Ext.Test setUp() method. 
 */
var SetUpNode = Node.extend( {
	
	/**
	 * @constructor
	 * @param {String} body The body of code in the setUp method.
	 */
	constructor : function( body ) {
		this.body = body;
	},
	
	
	/**
	 * Retrieves the body of the setUp() function.
	 * 
	 * @return {String}
	 */
	getBody : function() {
		return this.body;
	}
	
} );

module.exports = SetUpNode;