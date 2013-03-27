/*global require, module */
var CodeNode = require( './Code' );


/**
 * @class node.Test
 * @extends node.Code
 * 
 * Represents an Ext.Test Test. A Test has a name, and a body of code. 
 */
var TestNode = CodeNode.extend( {
	
	/**
	 * @constructor
	 * @param {String} name The name of the Suite.
	 * @param {String} body The body of code in the test.
	 */
	constructor : function( name, body ) {
		this._super( [ body ] );
		
		this.name = name;
	},
	
	
	/**
	 * Retrieves the Test's name.
	 * 
	 * @return {String}
	 */
	getName : function() {
		return this.name;
	},
	
	
	/**
	 * Accepts a Visitor.
	 * 
	 * @param {node.Visitor} visitor
	 */
	accept : function( visitor ) {
		visitor.visitTest( this );
	}
	
} );

module.exports = TestNode;