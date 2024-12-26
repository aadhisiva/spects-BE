import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "DemoAuthResponse" })
export class DemoAuthResponse {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    txnNo!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    txnDateTime!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    aadhaarHash!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    finalStatus!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    vaultRefNumber!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    beneficiaryAadhaarName!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    aadhaarDemoAuthStatus!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    aadhaarDemoAuthError!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    npciStatus!: string;

    @Column({ default: null, length: 255, type: 'nvarchar' })
    npciError!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    npciBankName!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    npciLastUpdateDate!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    nameMatchStatus!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_name!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    nameMatchScore!: string;

    @Column({ default: null, length: 200, type: 'nvarchar' })
    maskedAadhaar!: string;

    @CreateDateColumn()
    CreatedDate!: Date;

    @UpdateDateColumn()
    UpdatedDate!: Date;
}
