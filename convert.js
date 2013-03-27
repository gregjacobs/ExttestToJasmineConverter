/**
 * This file is to be run on node.js. Ex:
 * 
 * node convert.js input [output]
 * 
 * If no output is given, prints to the console.
 */

/*global process, require */
var fs = require( 'fs' ),
    argv = process.argv,
    Converter = require( './src/Converter' );


if( argv.length < 3 ) {
	console.log( "Unexpected number of arguments. Expected:\nnode [thisfile] inputFile [outputFile]\n\nIf no outputFile, prints output to console." );
	process.exit( 1 );
}


var inputFile = argv[ 2 ],
    outputFile = argv[ 3 ];

// Read the input file
var inputFileStr = fs.readFileSync( inputFile, 'utf8' );

// Apply conversion
var outputStr = new Converter().convert( inputFileStr );

// Write the output file if there is one, otherwise print to console
if( outputFile ) {
	fs.writeFileSync( outputFile, outputStr, 'utf8' );
} else {
	console.log( outputStr );
}