# uNoGS API Activation Guide

## Step-by-Step Activation

### 1. Go to RapidAPI
Visit: https://rapidapi.com/unogs/api/unogs/

### 2. Sign Up / Log In
- If you don't have a RapidAPI account, create one
- If you have an account, log in

### 3. Subscribe to a Plan

**Recommended for development: Basic Plan**
- 100 requests/day
- $0/month (free tier available) OR small fee
- Sufficient for building Movivid prototype

**For production: Pro Plan**
- 500 requests/day
- Better for regular catalog updates

### 4. Get Your API Key
After subscribing:
- You'll see your RapidAPI key on the page
- It's already in your `.env` file: `5IjyZlLhTQR22qC8LcvjePB64eOp8oDp`
- Verify it matches the key shown on RapidAPI dashboard

### 5. Test the API

Run the test script:
```bash
python unogs_wrapper.py
```

You should see:
```
Testing uNoGS API Connection...
============================================================
✓ Connection successful!

Top 20 Movies on Netflix:
------------------------------------------------------------
1. The Shawshank Redemption (1994) - Rating: 9.3
2. The Godfather (1972) - Rating: 9.2
...
```

### 6. If You See Errors

**"You are not subscribed to this API"**
- Go back to RapidAPI
- Make sure you clicked "Subscribe" on a plan
- Wait a few minutes for activation
- Try again

**"401 Unauthorized"**
- Check your API key in `.env` matches RapidAPI dashboard
- Make sure you copied it correctly

**"429 Too Many Requests"**
- You've hit the rate limit
- Wait until tomorrow or upgrade plan

## Next Steps After Activation

1. ✅ Test connection with `python unogs_wrapper.py`
2. ✅ Run `python build_movivid_catalog.py` to get top 20 films
3. ✅ Begin thematic preprocessing for those 20 films

## Support

If issues persist:
- Check RapidAPI status page
- Contact RapidAPI support
- Verify subscription is active in your RapidAPI dashboard
