# wait list processing needs to be finished!

# Need to finish Cloudflare Implementations
Need to pass IP address from video relay server to the on initialize to properly setup subdomain!


# Need to implement database sqlite solution for flagged video checksum and flagged provider mac addresses!

# Need to implement Verification Token Generation for Providers Where they send merkle verification to gateway to get token to attach to a video relay server

# Need to implement Where they send the video data to the video relay server and they must pass the checksum of it and the video relay server must check it as well if it doesnt match deny along with potentially passing the checksum with the gateway to additionally check if its a banned checksum before relaying it as well to help moderate.
# since the current setup wouldn't be easy to implement moderation tactics as its directly relaying as soon as it receives it!

# BUFFER OVERFLOW PROTECTIONS!!!!!!!! MAJORLY NEED TO IMPLEMENT THE BUFFER SIZE CHECK ON ALL WEBSOCKET MESSAGES! AND POTENTIALLY ON CONNECTIONS DOUBLE CHECK HEADERS SIZES FOR SAFETY AS ALONG WITH REQUEST BODY! and buffer size of whole REQUEST! as well! to really ensure the saftey of the server!

# Need to ...... figure out what i forgot!