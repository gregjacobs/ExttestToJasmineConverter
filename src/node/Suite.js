/*global require, module */
var AbstractNode = require( './Node' );


/**
 * @class node.Suite
 * @extends node.Node
 * 
 * Represents an Ext.Test Suite. A Suite has a name, and may be composed of one or more
 * child {@link node.Suite Suite} or {@link node.TestCase TestCase} nodes. 
 */
var SuiteNode = AbstractNode.extend( {
	
	/**
	 * @constructor
	 * @param {String} name The name of the Suite.
	 * @param {node.Node[]} children The child items.
	 */
	constructor : function( name, children ) {
		this.name = name;
		this.children = children;
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
	 * Retrieves the children.
	 * 
	 * @return {node.Node[]} The array of Suite and/or TestCase child nodes.
	 */
	getChildren : function() {
		return this.children || [];
	}
	
} );

module.exports = SuiteNode;