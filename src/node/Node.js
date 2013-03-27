/*global require, module */
var Class = require( '../Class' );


/**
 * @abstract
 * @class node.Node
 * 
 * Represent a parsed Ext.Test node. This is the base class for Suites, TestCases, and
 * Tests. Also defines the interface for {@link node.Visitor Visitors} to access each Node.
 */
var Node = Class.extend( Object, {
	abstractClass : true,
	
	/**
	 * Allows a {@link node.Visitor Node Visitor} to access the structure.
	 * 
	 * @abstract
	 * @param {node.Visitor} visitor
	 */
	accept : Class.abstractMethod
	
} );

module.exports = Node;