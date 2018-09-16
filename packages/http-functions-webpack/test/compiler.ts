import * as path from 'path';
import * as webpack from 'webpack';

export default (fixture): Promise<string> => {
  const bundle = `bundle.${Math.floor(Math.random() * 1000)}.tmp.js`;
  const compiler = webpack({
    context: __dirname,
    entry: fixture,
    target: 'node',
    output: {
      path: path.resolve(__dirname),
      filename: bundle,
      libraryTarget: 'commonjs',
    },
    module: {
      rules: [
        {
          test: /\.web\.(js|ts)$/,
          use: {
            loader: path.resolve(__dirname, '../dist/src/index.js'),
            options: {
              endpoint: 'http://localhost:3000/api',
            },
          },
        },
      ],
    },
  });

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        console.log(stats.toString());
        reject(err);
      } else {
        resolve(path.resolve(__dirname, bundle));
      }
    });
  });
};
