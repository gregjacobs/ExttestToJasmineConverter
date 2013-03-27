/*global require, module */
var CodeNode = require( './Code' );


/**
 * @class node.SetUp
 * @extends node.Code
 * 
 * Represents an Ext.Test tearDown() method. 
 */
var TearDownNode = CodeNode.extend( {
	
	/**
	 * Accepts a Visitor.
	 * 
	 * @param {node.Visitor} visitor
	 */
	accept : function( visitor ) {
		visitor.visitTearDown( this );
	}
	
} );

module.exports = TearDownNode;