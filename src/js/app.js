App = {
  loading: false,
  contracts: {},
  hasVoted: false,

  load: async () => {
    await App.loadWeb3()
    await App.loadContract()
    await App.render()
  },

  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        const account = await window.ethereum.request({method: 'eth_requestAccounts'});
        App.account = account
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {

      App.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})

    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  
  //Loading Contract 
  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const election = await $.getJSON('Election.json')
    App.contracts.Election = TruffleContract(election)
    App.contracts.Election.setProvider(App.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    App.election = await App.contracts.Election.deployed()
  },

  //render Function
  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#accountAddress').html(App.account)

    // Render Tasks
    await App.renderCandidates()

    // Update loading state
    App.setLoading(false)
  },

  //rendering the candidates to the screen
  renderCandidates: async () => {
    // Load the total task count from the blockchain
    const candidateCount = await App.election.candidatesCount()
    console.log(candidateCount);
    const candidatesResults = $("#candidatesResults");
    candidatesResults.empty();

    const candidatesSelect = $('#candidatesSelect');
    candidatesSelect.empty();

    //Creating new Template
    for (var i = 1; i <= candidateCount; i++) {
      // Fetch the task data from the blockchain
      const candidate = await App.election.candidates(i)
      const id = candidate[0].toNumber()
      const name = candidate[1]
      const voteCount = candidate[2]

      // Create the html for the task
      const candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
      candidatesResults.append(candidateTemplate);

      const hasVoted = await App.election.voters(App.account);
      if (hasVoted) {
        $('form').hide();
      } else {
        App.setLoading(false);
      }

    }
  },

//Cast Vote Fucntion
castVote: async ()=>{
  const candidateId =  $('#candidatesSelect').val();
  App.setLoading(true);
  await App.election.vote(candidateId,{from: App.account[0]});
  App.setLoading(false);
},


  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

$(() => {
  $(window).load(() => {
    App.load()
  })
})