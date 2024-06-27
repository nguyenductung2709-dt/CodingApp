# Performance test results

Brief description of the used server: HTTP/1.1 

Brief description of your computer: Macbook Air M1

### Loading the assignment page

http_reqs: 4336
http_req_duration - median: 22.98ms
http_req_duration - 95th percentile: 36.18ms

### Loading the assignment page with cache (30s)
http_reqs: 14158
http_req_duration - median: 21.11ms
http_req_duration - 95th percentile: 30.02ms
http_req_duration - min: 10.04ms
http_req_duration - max: 130.8ms

This is because for the first time, the results must be cached so http_req_duration max is really slow, but as the requests increase, the
average duration is reduced.

### Submitting assignments

http_reqs: 10
http_req_duration - median: 11.57s
http_req_duration - 95th percentile: 12.33s

