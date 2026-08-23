source "https://rubygems.org"

# Building with GitHub Actions, not the legacy Pages builder — so use real Jekyll rather than the `github-pages` meta-gem.
gem "jekyll", "~> 4.3"

# The gem theme this site is built on.
gem "jekyll-theme-hacker", "~> 0.2"

# Plugins — must match the `plugins:` list in _config.yml.
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-seo-tag", "~> 2.8"
end

# Ruby 3 no longer ships webrick; `jekyll serve` needs it.
gem "webrick", "~> 1.8"