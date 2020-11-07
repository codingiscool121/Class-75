import React from 'react';
import { Text, View, FlatList, StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import firebase from 'firebase';
import db from '../config'
import TransactionScreen from './BookTransactionScreen';

export default class Login extends React.Component{
    constructor(props){
    super(props);
    this.state={
        emailId: "",
        password:"",
    }
    }
    authUser=async(emailId,password)=>{
        console.log(emailId+password);
        if(emailId && password){
            try {
                const response = await firebase.auth().signInWithEmailAndPassword(emailId,password)
                if(response){
                    this.props.navigation.navigate('Transaction')
                }
            } catch (error) {
                switch(error.code){
                    case 'auth/user-not-found':
                    alert("You do not exist in our database.");
                    break;
                    case 'auth/invalid-email':
                        alert("Your username or password are invalid.");
                        break;
                }
            }
        }else{
            alert("Please enter your email and password to continue.")
        }
    }
render(){
    return(   
        <View><Text>Login To Villager's Library</Text>
        <TextInput style={styles.textBox} placeholder="Enter Your Email Here" keyboardType='email-address' 
        onChangeText = {text=>{
            this.setState({
                emailId:text
            })
        }}
        />
           <TextInput style={styles.textBox} placeholder="Enter Your Password Here" secureTextEntry={true} 
        onChangeText = {text=>{
            this.setState({
                password:text
            })
        }}
        />
      <TouchableOpacity onPress={()=>{
          this.authUser(
              this.state.emailId,this.state.password
          )
      }} style={{height:100,width:100, marginTop:20, backgroundColor:"turquoise", borderRadius: 1000, alignItems:'center', justifyContent: 'center'}}>
          <Text>Login To Villagers Library</Text>
      </TouchableOpacity>
   </View>
    )
}
}

const styles = StyleSheet.create({
textBox:{width:200,height:50,borderWidth:2, fontSize:15, margin:10, paddingLeft: 10}
})