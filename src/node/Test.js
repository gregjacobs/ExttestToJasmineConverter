/*global require, module */
var Node = require( './Node' );


/**
 * @class node.Test
 * 
 * Represents an Ext.Test Test. A Test has a name, and a body of code. 
 */
var TestNode = Node.extend( {
	
	/**
	 * @constructor
	 * @param {String} name The name of the Suite.
	 * @param {String} body The body of code in the test.
	 */
	constructor : function( name, body ) {
		this.name = name;
		this.body = body;
	},
	
	
	/**
	 * Retrieves the name.
	 * 
	 * @return {String}
	 */
	getName : function() {
		return this.name;
	},
	
	
	/**
	 * Retrieves the body of the test method.
	 * 
	 * @return {String}
	 */
	getBody : function() {
		return this.body;
	}
	
} );

module.exports = TestNode;