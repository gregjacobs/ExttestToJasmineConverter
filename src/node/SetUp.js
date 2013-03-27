/*global require, module */
var CodeNode = require( './Code' );


/**
 * @class node.SetUp
 * @extends node.Code
 * 
 * Represents an Ext.Test setUp() method. 
 */
var SetUpNode = CodeNode.extend( {
	
	/**
	 * Accepts a Visitor.
	 * 
	 * @param {node.Visitor} visitor
	 */
	accept : function( visitor ) {
		visitor.visitSetUp( this );
	}
	
} );

module.exports = SetUpNode;