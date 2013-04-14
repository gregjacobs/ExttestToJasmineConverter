/**
 * This file is to be run on node.js. Ex:
 * 
 * $ node convert.js input [output]
 * 
 * If no output is given, prints to the console.
 */

/*global process, require */
var fs = require( 'fs' ),
    path = require( 'path' ),
    _ = require( 'lodash' ),
    mkdirp = require( 'mkdirp' ),
    argv = process.argv,
    Converter = require( './src/Converter' );


// Print help if not enough arguments, or -h or --help option is provided
if( argv.length <= 2 || argv.indexOf( '-h' ) !== -1 || argv.indexOf( '--help' ) !== -1 ) {
	console.log( "" );
	console.log( "  Usage: node convert.js [options] inputFile [outputFile]" );
	console.log( "     or: node convert.js [options] inputDir outputDir" );
	console.log( "  " );
	console.log( "  In the first form, if no `outputFile` is specified, prints converted output to console." );
	console.log( "  " );
	console.log( "  " );
	console.log( "  Options: " );
	console.log( "    -h, --help          This help output" );
	console.log( "  " );
	console.log( "        --inputMask     A simple wildcard mask for input files. Ex: --inputMask=*Test.js" );
	console.log( "                        Valid only for the input/output directory form of the command." );
	console.log( "  " );
	console.log( "        --outputMask    A simple wildcard mapper for output files. Only valid if an" );
	console.log( "                        `inputMask` is specified. Whatever matches the * in the inputMask" );
	console.log( "                        will be replace the * in the outputMask. Ex: --outputMask=*Spec.js" );
	console.log( "                        Valid only for the input/output directory form of the command." );
	console.log( "  " );
	console.log( "  Example:" );
	console.log( "    node convert.js MyTest.js MySpec.js" );
	console.log( "  " );
	console.log( "  Mapping filenames" );
	console.log( "    node convert.js --inputMask=*Test.js --outputMask=*Spec.js test/ spec/" );
	
	process.exit( 1 );
}


// --------------------------------------------------

// Parse the arguments
var inputPath = "",
    outputPath = "",
    inputMask = "*",   // all files by default
    outputMask = "*",  // use original filename by default
    isDirectory = false;  // will be set to true if processing a directory (i.e. the inputPath is a directory)

for( var i = 2, len = argv.length; i < len; i++ ) {  // start at the 3rd argument, which would be the first argument to the program
	var arg = argv[ i ];
	
	if( arg.charAt( 0 ) === '-' ) {
		var argName = arg.split( '=' )[ 0 ],
		    argValue = arg.split( '=' )[ 1 ];
		
		switch( argName ) {
			case "--inputMask" :
				inputMask = argValue;
				if( !inputMask ) {
					console.error( "No --inputMask value" );
					process.exit( 1 );
				}
				if( inputMask.indexOf( '*' ) === -1 ) {
					console.error( "The inputMask must have a * character" );
					process.exit( 1 );
				}
				break;
				
			case "--outputMask" :
				outputMask = argValue;
				if( !outputMask ) {
					console.error( "No --outputMask value" );
					process.exit( 1 );
				}
				if( outputMask.indexOf( '*' ) === -1 ) {
					console.error( "The outputMask must have a * character" );
					process.exit( 1 );
				}
				break;
				
			default :
				console.error( "Unknown option: ", arg );
				console.error( "Use -h switch for usage. Ex: node convert.js -h" );
				process.exit( 1 );
		}
		
	} else if( !inputPath ) {   // not an option, and input file isn't set yet
		inputPath = arg;
	} else {
		outputPath = arg;
	}
}


// Check Arguments

if( !inputPath ) {
	console.error( "No input file or directory specified." );
	process.exit( 1 );
}

if( fs.statSync( inputPath ).isDirectory() ) {
	isDirectory = true;
	
	if( !outputPath ) {
		console.error( "outputDir arg required (can just be a '.' for the current directory)" );
		process.exit( 1 );
	}
}


// Create absolute paths for the input and output paths
inputPath = path.resolve( inputPath );
outputPath = ( outputPath ) ? path.resolve( outputPath ) : "";   // empty string if no arg provided for an output file (when converting single file only)


// --------------------------------------------------

// Create a mapping of input files to output files

var inputMaskRe = new RegExp( '^' + inputMask.replace( /\*/, "(.*?)" ) + '$' ),  // ex: *Test.js converts to the regex: ^(.*?)Test.js$
    fileMappings = {};  // map of source files to destination files

function processPath( currentPath ) {
	var currentPathStat = fs.statSync( currentPath );
	
	if( currentPathStat.isDirectory() ) {
		// It's a directory, read all files and subdirectories, and process them
		var files = fs.readdirSync( currentPath );
		files.forEach( function( file ) {
			if( file.charAt( 0 ) !== '.' ) {  // skip files that start with a '.'
				processPath( path.join( currentPath, file ) );
			}
		} );
		
	} else {
		// It's a file
		var filename = path.basename( currentPath ),
		    match = filename.match( inputMaskRe );   // match it against the input mask
		
		if( match ) {
			var outputDir = path.dirname( currentPath ),
			    outputFilename = outputMask.replace( /\*/, match[ 1 ] );  // replace the '*' in the output mask with the part that matched the '*' in the input mask
			
			if( outputPath ) {
				var re = new RegExp( "^" + inputPath.replace( /\\/g, "\\\\" ) );  // escape backslashes in directory string for regex (windows only)
				outputDir = outputDir.replace( re, outputPath );
			}
			fileMappings[ currentPath ] = path.join( outputDir, outputFilename );
		}
	}
}

if( isDirectory ) {
	processPath( inputPath );
} else {  // file path
	fileMappings[ inputPath ] = outputPath || "";  // simple inputFile -> outputFile mapping
}


// ------------------------------------------

// Do Conversions
_.forOwn( fileMappings, function( outputPath, inputPath ) {
	// Read the input file
	var inputFileStr = fs.readFileSync( inputPath, 'utf8' );
	
	// Apply conversion
	var outputStr = new Converter().convert( inputFileStr, inputPath );
	
	// Write the output file if there is one, otherwise print to console
	if( outputPath ) {
		// Create the output directory if it doesn't exist
		mkdirp.sync( path.dirname( outputPath ) );
		
		fs.writeFileSync( outputPath, outputStr, 'utf8' );
	} else {
		console.log( outputStr );
	}
} );