require 'rake'

desc 'Default: build.'
task :default => :build

desc 'Build glider.js'
task :build do
  begin
    `sprocketize src/glider.js > dist/glider.js`
  rescue => e
    puts " *** Error while building glider.js: #{e.message}"
  end
end