import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class demoAuthResponse {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ default: '' })
    txnNo: string;
  
    @Column({ default: '' })
    txnDateTime: string;
  
    @Column({ default: '' })
    aadhaarHash: string;
  
    @Column({ default: '' })
    finalStatus: string;
  
    @Column({ default: '' })
    vaultRefNumber: string;
  
    @Column({ default: '' })
    beneficiaryAadhaarName: string;
  
    @Column({ default: '' })
    aadhaarDemoAuthStatus: string;
  
    @Column({ default: '' })
    aadhaarDemoAuthError: string;
  
    @Column({ default: '' })
    npciStatus: string;
  
    @Column({ default: '' })
    npciError: string;
  
    @Column({ default: '' })
    npciBankName: string;

    @Column({ default: '' })
    npciLastUpdateDate: string;
  
    @Column({ default: '' })
    nameMatchStatus: string;
  
    @Column({ default: '' })
    ekyc_name: string;
  
    @Column({ default: '' })
    nameMatchScore: string;
  
    @Column({ default: '' })
    maskedAadhaar: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  