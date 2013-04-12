/*global require, module */
var CodeNode = require( './Code' );


/**
 * @class node.HelperMethod
 * @extends node.Code
 * 
 * Represents a helper method within a {@link node.TestCase}. A helper method has a name, 
 * and a body of code. 
 */
var HelperMethodNode = CodeNode.extend( {
	
	/**
	 * @constructor
	 * @param {String} name The name of the helper method.
	 * @param {String} argsList The arguments list for the helper method.
	 * @param {String} body The body of code in the method.
	 */
	constructor : function( name, argsList, body ) {
		this._super( [ body ] );
		
		this.name = name;
		this.argsList = argsList;
	},
	
	
	/**
	 * Retrieves the helper method's name.
	 * 
	 * @return {String}
	 */
	getName : function() {
		return this.name;
	},
	
	
	/**
	 * Retrieves the helper method's arguments list.
	 * 
	 * @return {String}
	 */
	getArgsList : function() {
		return this.argsList;
	}
	
} );

module.exports = HelperMethodNode;