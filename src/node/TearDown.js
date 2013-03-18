/*global require, module */
var Node = require( './Node' );


/**
 * @class node.SetUp
 * 
 * Represents an Ext.Test tearDown() method. 
 */
var TearDownNode = Node.extend( {
	
	/**
	 * @constructor
	 * @param {String} body The body of code in the tearDown method.
	 */
	constructor : function( body ) {
		this.body = body;
	},
	
	
	/**
	 * Retrieves the body of the tearDown() function.
	 * 
	 * @return {String}
	 */
	getBody : function() {
		return this.body;
	}
	
} );

module.exports = TearDownNode;