/*global require, module */
var CodeNode = require( './Code' );


/**
 * @class node.SetUp
 * @extends node.Code
 * 
 * Represents an Ext.Test tearDown() method. 
 */
var TearDownNode = CodeNode.extend( {
	
	// No implementation - inherits superclass
	
} );

module.exports = TearDownNode;