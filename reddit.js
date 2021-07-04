const puppeteer = require('puppeteer');
const fs = require('fs');

const subRedditUrl = (reddit) => `https://old.reddit.com/r/${reddit}`

const scrapper = {
  browser: null,
  page: null,

  start: async (subReddit) => {
    try{
      scrapper.browser = await puppeteer.launch({
      headless:false,
      defaultViewport: null,
      args: ["--start-maximized"],
      slowMo: 100,
      });
      scrapper.page = await scrapper.browser.newPage();
      await scrapper.page.goto(subRedditUrl(subReddit));
      console.log("Started");
      return "started"
    }catch(err){
      console.log(err);
    }
  },

  getAllPosts: async () => {
      await scrapper.page.waitForSelector("#siteTable>.thing");
      let posts = await scrapper.page.evaluate(() => {
        let postsData = [];
        let allPosts = document.querySelectorAll("#siteTable>.thing");
        for(let post of allPosts){
          let title = post.querySelector(".title>a").innerText.trim();
          let comments;
          let submitted;
          let author;
          if(post.querySelector(".first>a") !== null)
            comments = post.querySelector(".first>a").innerText.trim();
          if(post.querySelector(".tagline>time") !== null)
            submitted = post.querySelector(".tagline>time").getAttribute("title");
          if(post.querySelector(".tagline>a") !== null)
            author = post.querySelector(".tagline>a").innerText.trim();
          
          let likes = post.querySelector(".midcol.unvoted>.score.likes").innerText.trim();
          let dislikes = post.querySelector(".midcol.unvoted>.score.dislikes").innerText.trim();
          let upvoted = post.querySelector(".midcol.unvoted>.score.unvoted").innerText.trim();
          
          postsData.push({
            title, comments, submitted, author, likes, dislikes, upvoted
          })
        }
        return postsData;
      })

      return posts;
  },

  getPosts: async (noOfPosts) => {
    let posts = [];

    while(posts.length < noOfPosts){
      try{
        let newPosts = await scrapper.getAllPosts();
        posts = [...posts, ...newPosts];
       if(posts.length < noOfPosts){
         let nextButton = await scrapper.page.evaluate(() => {
            if(document.querySelector('.next-button'))
              return true;
            else return false;
         })
         if(nextButton){
          await Promise.all([
            scrapper.page.waitForNavigation(),
            scrapper.page.click('.next-button')
          ])
         }else{
           break;
         }
       }
      }catch(err){
        console.log(err);
      }
    }
    return posts.slice(0, noOfPosts);
  },

}

const execute = async () => {
  let start = await scrapper.start('react');
  console.log(start);
  let getPosts = await scrapper.getPosts(40);
  console.log(getPosts);
}

execute();