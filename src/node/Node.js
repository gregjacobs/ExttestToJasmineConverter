/*global require, module */
var Class = require( '../Class' );


/**
 * @abstract
 * @class node.Node
 * 
 * Represent a parsed Ext.Test node. This is the base class for Suites, TestCases, and
 * Tests.
 */
var AbstractNode = Class.extend( Object, {
	
	abstractClass : true
	
} );

module.exports = AbstractNode;